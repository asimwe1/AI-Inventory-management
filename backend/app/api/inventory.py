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
        product = db.query(Product).filter(Product.id == transaction.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {transaction.product_id}")
        if transaction.transaction_type != TransactionType.RECEIVED:
            raise HTTPException(status_code=400, detail="Invalid transaction type for receive endpoint")
        
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
        product.current_stock = new_stock
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error receiving stock: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process transaction: {str(e)}")

@router.post("/adjust", response_model=InventoryTransactionResponse)
async def adjust_stock(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    try:
        product = db.query(Product).filter(Product.id == transaction.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {transaction.product_id}")
        if transaction.transaction_type != TransactionType.ADJUSTED:
            raise HTTPException(status_code=400, detail="Invalid transaction type for adjust endpoint")
        
        previous_stock = product.current_stock
        new_stock = previous_stock + transaction.quantity if transaction.quantity > 0 else previous_stock - abs(transaction.quantity)
        
        db_transaction = InventoryTransaction(
            product_id=transaction.product_id,
            transaction_type=TransactionType.ADJUSTED,
            quantity=abs(transaction.quantity),
            previous_stock=previous_stock,
            new_stock=new_stock,
            reference_number=transaction.reference_number,
            notes=transaction.notes
        )
        product.current_stock = new_stock
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adjusting stock: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process transaction: {str(e)}")
    
    
@router.post("/ship", response_model=InventoryTransactionResponse)
async def ship_stock(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    try:
        product = db.query(Product).filter(Product.id == transaction.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {transaction.product_id}")
        if transaction.transaction_type != TransactionType.SHIPPED:
            raise HTTPException(status_code=400, detail="Invalid transaction type for ship endpoint")
        if product.current_stock < transaction.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Current stock: {product.current_stock}"
            )

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

        product.current_stock = new_stock
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except HTTPException:
        raise  # Re-raise HTTPException to return 400/404 as intended
    except Exception as e:
        db.rollback()
        logger.error(f"Error shipping stock: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process transaction: {str(e)}")

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

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(InventoryTransaction)
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

@router.get("/inventory/transactions", response_model=List[InventoryTransactionResponse])
async def get_all_transactions_alt(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all inventory transactions (alternative endpoint)"""
    return await get_all_transactions(skip, limit, db)

@router.get("/inventory/status", response_model=List[ProductResponse])
async def get_inventory_status_alt(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get inventory status (alternative endpoint)"""
    return await get_inventory_status(skip, limit, db)

@router.post("/inventory/receive", response_model=InventoryTransactionResponse)
async def receive_stock_alt(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    """Receive stock (alternative endpoint)"""
    return await receive_stock(transaction, db)

@router.post("/inventory/ship", response_model=InventoryTransactionResponse)
async def ship_stock_alt(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    """Ship stock (alternative endpoint)"""
    return await ship_stock(transaction, db)

@router.post("/inventory/adjust", response_model=InventoryTransactionResponse)
async def adjust_stock_alt(transaction: InventoryTransactionCreate, db: Session = Depends(get_db)):
    """Adjust stock (alternative endpoint)"""
    return await adjust_stock(transaction, db)