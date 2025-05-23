from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.database.models import Product, InventoryTransaction, TransactionType
from pydantic import BaseModel, Field
from datetime import datetime
import logging

router = APIRouter(prefix="/inventory", tags=["inventory"])

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

class InventoryTransactionBase(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    reference_number: str | None = None
    notes: str | None = None

class InventoryTransactionCreate(InventoryTransactionBase):
    transaction_type: TransactionType

class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    transaction_type: TransactionType
    previous_stock: int
    new_stock: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/receive", response_model=InventoryTransactionResponse)
async def receive_stock(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    try:
        # Get product
        product = db.query(Product).filter(Product.id == transaction.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Create transaction
        previous_stock = product.current_stock
        new_stock = previous_stock + transaction.quantity
        
        db_transaction = InventoryTransaction(
            product_id=transaction.product_id,
            transaction_type=TransactionType.RECEIVED,
            quantity=transaction.quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reference_number=transaction.reference_number,
            notes=transaction.notes
        )

        # Update product stock
        product.current_stock = new_stock

        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    except Exception as e:
        db.rollback()
        logger.error(f"Error receiving stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ship", response_model=InventoryTransactionResponse)
async def ship_stock(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    try:
        # Get product
        product = db.query(Product).filter(Product.id == transaction.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if enough stock
        if product.current_stock < transaction.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Current stock: {product.current_stock}"
            )

        # Create transaction
        previous_stock = product.current_stock
        new_stock = previous_stock - transaction.quantity
        
        db_transaction = InventoryTransaction(
            product_id=transaction.product_id,
            transaction_type=TransactionType.SHIPPED,
            quantity=transaction.quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reference_number=transaction.reference_number,
            notes=transaction.notes
        )

        # Update product stock
        product.current_stock = new_stock

        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    except Exception as e:
        db.rollback()
        logger.error(f"Error shipping stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/{product_id}", response_model=List[InventoryTransactionResponse])
async def get_product_transactions(
    product_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return transactions

@router.get("/status", response_model=List[ProductResponse])
async def get_inventory_status(
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