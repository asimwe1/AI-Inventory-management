from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging
from sqlalchemy.exc import SQLAlchemyError
from .models import Base  # Import Base from models
import time
from urllib.parse import urlparse

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_database_url():
    """Get and validate database URL."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL not found in environment variables, using default")
        database_url = "postgresql://javauser:password@localhost:5432/inventory"
    
    # Parse the URL to validate it
    try:
        parsed = urlparse(database_url)
        if not all([parsed.scheme, parsed.netloc]):
            raise ValueError("Invalid database URL format")
        return database_url
    except Exception as e:
        logger.error(f"Invalid DATABASE_URL format: {e}")
        raise

# Get database URL from environment variable
SQLALCHEMY_DATABASE_URL = get_database_url()

# Configure PostgreSQL connection pool
POSTGRES_POOL_SIZE = int(os.getenv("POSTGRES_POOL_SIZE", "5"))
POSTGRES_MAX_OVERFLOW = int(os.getenv("POSTGRES_MAX_OVERFLOW", "10"))
POSTGRES_POOL_TIMEOUT = int(os.getenv("POSTGRES_POOL_TIMEOUT", "30"))
POSTGRES_RETRY_ATTEMPTS = int(os.getenv("POSTGRES_RETRY_ATTEMPTS", "5"))
POSTGRES_RETRY_DELAY = int(os.getenv("POSTGRES_RETRY_DELAY", "5"))

def get_engine():
    """Create and return a database engine with appropriate configuration."""
    for attempt in range(POSTGRES_RETRY_ATTEMPTS):
        try:
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_size=POSTGRES_POOL_SIZE,
                max_overflow=POSTGRES_MAX_OVERFLOW,
                pool_timeout=POSTGRES_POOL_TIMEOUT,
                pool_pre_ping=True,
                pool_recycle=3600,  # Recycle connections after 1 hour
                echo=True
            )
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Successfully connected to PostgreSQL database")
            return engine
        except Exception as e:
            logger.error(f"Attempt {attempt + 1}/{POSTGRES_RETRY_ATTEMPTS} failed: {e}")
            if attempt < POSTGRES_RETRY_ATTEMPTS - 1:
                logger.info(f"Retrying in {POSTGRES_RETRY_DELAY} seconds...")
                time.sleep(POSTGRES_RETRY_DELAY)
            else:
                logger.error("All connection attempts failed")
                raise

# Create engine
engine = get_engine()

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

@contextmanager
def get_db():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()

def init_db():
    """Initialize the database, creating all tables."""
    try:
        logger.info("Creating database tables...")
        # Log all tables that will be created
        for table in Base.metadata.tables.values():
            logger.info(f"Creating table: {table.name}")
            for column in table.columns:
                logger.info(f"  Column: {column.name} ({column.type})")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def check_db_connection():
    """Check if the database connection is working."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection check successful")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False 