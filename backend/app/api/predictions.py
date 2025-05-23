from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Product
from app.models.predict import DemandPredictor
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

router = APIRouter(prefix="/predictions", tags=["predictions"])

logger = logging.getLogger(__name__)

# Initialize predictor
predictor = DemandPredictor(
    model_path="models/saved",
    data_path="data/processed"
)

# Pydantic models
class PredictionRequest(BaseModel):
    product_id: str
    days_ahead: Optional[int] = 30

class PredictionResponse(BaseModel):
    product_id: str
    predictions: List[dict]
    generated_at: datetime

class InventoryAdviceRequest(BaseModel):
    product_id: str
    current_stock: int

class InventoryAdviceResponse(BaseModel):
    product_id: str
    advice: str
    order_quantity: int
    reorder_point: int
    days_of_stock: float
    urgency: str

@router.post("/demand", response_model=PredictionResponse)
async def predict_demand(request: PredictionRequest, db: Session = Depends(get_db)):
    try:
        # Verify product exists
        product = db.query(Product).filter(Product.id == request.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Generate predictions
        predictions_df = predictor.predict_demand(
            request.product_id, request.days_ahead
        )
        
        # Convert predictions to list of dicts
        predictions = []
        for _, row in predictions_df.iterrows():
            predictions.append({
                "date": row["date"].isoformat(),
                "predicted_demand": float(row["combined_prediction"]),
                "lower_bound": float(row["prophet_lower"]),
                "upper_bound": float(row["prophet_upper"])
            })

        return PredictionResponse(
            product_id=request.product_id,
            predictions=predictions,
            generated_at=datetime.now()
        )

    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/advice", response_model=InventoryAdviceResponse)
async def get_inventory_advice(request: InventoryAdviceRequest, db: Session = Depends(get_db)):
    try:
        # Verify product exists
        product = db.query(Product).filter(Product.id == request.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Get predictions for the next 30 days
        predictions_df = predictor.predict_demand(request.product_id, 30)
        
        # Calculate average daily demand
        daily_demand = predictions_df["combined_prediction"].mean()
        
        # Calculate days of stock remaining
        days_of_stock = request.current_stock / daily_demand if daily_demand > 0 else float('inf')
        
        # Calculate reorder point (7 days lead time + 5 days safety stock)
        reorder_point = int(daily_demand * (7 + 5))
        
        # Determine urgency
        if days_of_stock < 7:  # Less than lead time
            urgency = "HIGH"
        elif days_of_stock < 14:  # Less than lead time + safety stock
            urgency = "MEDIUM"
        else:
            urgency = "LOW"
        
        # Calculate order quantity
        order_quantity = max(0, reorder_point - request.current_stock)
        
        # Generate advice
        if order_quantity > 0:
            advice = f"Order {order_quantity} units"
        else:
            advice = "No immediate order needed"

        return InventoryAdviceResponse(
            product_id=request.product_id,
            advice=advice,
            order_quantity=order_quantity,
            reorder_point=reorder_point,
            days_of_stock=round(days_of_stock, 1),
            urgency=urgency
        )

    except Exception as e:
        logger.error(f"Error generating inventory advice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 