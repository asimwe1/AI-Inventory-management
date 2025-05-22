from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Product, InventoryTransaction, TransactionType
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter(prefix="/products", tags=["products"])

logger = logging.getLogger(__name__)

# Pydantic models
class ProductBase(BaseModel):
    id: str
    name: str
    description: str | None = None
    reorder_point: int | None = None

class ProductCreate(ProductBase):
    initial_stock: int = 0

class ProductResponse(ProductBase):
    current_stock: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    try:
        # Check if product already exists
        existing_product = db.query(Product).filter(Product.id == product.id).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="Product ID already exists")

        # Create new product
        db_product = Product(
            id=product.id,
            name=product.name,
            description=product.description,
            reorder_point=product.reorder_point,
            current_stock=product.initial_stock
        )
        db.add(db_product)

        # Create initial stock transaction if initial_stock > 0
        if product.initial_stock > 0:
            transaction = InventoryTransaction(
                product_id=product.id,
                transaction_type=TransactionType.RECEIVED,
                quantity=product.initial_stock,
                previous_stock=0,
                new_stock=product.initial_stock,
                reference_number="INITIAL_STOCK",
                notes="Initial stock"
            )
            db.add(transaction)

        db.commit()
        db.refresh(db_product)
        return db_product

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("", response_model=list[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    products = (
        db.query(Product)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return products

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductBase,
    db: Session = Depends(get_db)
):
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Update product fields
        for field, value in product_update.dict(exclude_unset=True).items():
            setattr(db_product, field, value)

        db.commit()
        db.refresh(db_product)
        return db_product

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if product has stock
        if db_product.current_stock > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete product with remaining stock"
            )

        db.delete(db_product)
        db.commit()
        return {"message": "Product deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 