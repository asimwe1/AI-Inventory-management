import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.database.database import get_engine
from app.database.models import Base, Product
from app.api.products import ProductCreate

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database tables."""
    try:
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        sys.exit(1)

def seed_products():
    """Seed the database with sample products."""
    try:
        engine = get_engine()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Sample products data
        sample_products = [
            ProductCreate(
                name="Laptop Pro X1",
                description="High-performance business laptop",
                category="Electronics",
                sku="LAP-X1-2024",
                unit_price=1299.99,
                min_stock_level=5,
                max_stock_level=50,
                lead_time_days=14,
                reorder_point=10
            ),
            ProductCreate(
                name="Wireless Mouse",
                description="Ergonomic wireless mouse",
                category="Electronics",
                sku="MOU-WL-001",
                unit_price=49.99,
                min_stock_level=10,
                max_stock_level=100,
                lead_time_days=7,
                reorder_point=20
            ),
            ProductCreate(
                name="Office Chair",
                description="Ergonomic office chair with lumbar support",
                category="Furniture",
                sku="CHR-ERG-2024",
                unit_price=299.99,
                min_stock_level=3,
                max_stock_level=20,
                lead_time_days=21,
                reorder_point=5
            ),
            ProductCreate(
                name="Desk Lamp",
                description="LED desk lamp with adjustable brightness",
                category="Furniture",
                sku="LMP-LED-001",
                unit_price=39.99,
                min_stock_level=8,
                max_stock_level=50,
                lead_time_days=10,
                reorder_point=15
            ),
            ProductCreate(
                name="Notebook Set",
                description="Set of 3 premium notebooks",
                category="Office Supplies",
                sku="NBK-SET-001",
                unit_price=24.99,
                min_stock_level=15,
                max_stock_level=200,
                lead_time_days=5,
                reorder_point=30
            )
        ]

        # Create products
        for product_data in sample_products:
            try:
                # Generate product ID using SKU
                product_id = f"PROD-{product_data.sku}"
                
                # Check if product already exists
                existing_product = db.query(Product).filter(Product.id == product_id).first()
                if existing_product:
                    logger.info(f"Product {product_id} already exists, skipping...")
                    continue

                # Create new product
                db_product = Product(
                    id=product_id,
                    name=product_data.name,
                    description=product_data.description,
                    category=product_data.category,
                    sku=product_data.sku,
                    unit_price=product_data.unit_price,
                    min_stock_level=product_data.min_stock_level,
                    max_stock_level=product_data.max_stock_level,
                    lead_time_days=product_data.lead_time_days,
                    reorder_point=product_data.reorder_point or product_data.min_stock_level,
                    current_stock=0
                )
                db.add(db_product)
                logger.info(f"Created product: {product_id}")

            except Exception as e:
                logger.error(f"Error creating product {product_data.sku}: {e}")
                continue

        db.commit()
        logger.info("Database seeded successfully")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

def main():
    """Main function to initialize and seed the database."""
    logger.info("Starting database initialization...")
    init_db()
    logger.info("Starting database seeding...")
    seed_products()
    logger.info("Database initialization and seeding completed successfully")

if __name__ == "__main__":
    main() 