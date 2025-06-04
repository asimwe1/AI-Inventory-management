from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class TransactionType(enum.Enum):
    RECEIVED = "received"
    SHIPPED = "shipped"
    ADJUSTED = "adjusted"

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    unit_price = Column(Float, nullable=False)
    min_stock_level = Column(Integer, nullable=False)
    max_stock_level = Column(Integer, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    current_stock = Column(Integer, default=0)
    reorder_point = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    inventory_transactions = relationship("InventoryTransaction", back_populates="product")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True)
    product_id = Column(String, ForeignKey("products.id"))
    transaction_type = Column(Enum(TransactionType))
    quantity = Column(Integer, nullable=False)
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reference_number = Column(String)  # PO number, shipping number, etc.
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory_transactions") 