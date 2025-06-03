from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging
from sqlalchemy.exc import SQLAlchemyError
from .models import Base  # Import Base from models

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Handle Render's database URL format
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL

# Configure PostgreSQL connection pool
POSTGRES_POOL_SIZE = int(os.getenv("POSTGRES_POOL_SIZE", "5"))
POSTGRES_MAX_OVERFLOW = int(os.getenv("POSTGRES_MAX_OVERFLOW", "10"))
POSTGRES_POOL_TIMEOUT = int(os.getenv("POSTGRES_POOL_TIMEOUT", "30"))

def get_engine():
    """Create and return a database engine with appropriate configuration."""
    try:
        # Always use PostgreSQL configuration
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_size=POSTGRES_POOL_SIZE,
            max_overflow=POSTGRES_MAX_OVERFLOW,
            pool_timeout=POSTGRES_POOL_TIMEOUT,
            pool_pre_ping=True,  # Enable connection health checks
            echo=True  # Enable SQL query logging
        )
        # Log connection info without sensitive data
        db_url_parts = SQLALCHEMY_DATABASE_URL.split('@')
        if len(db_url_parts) > 1:
            safe_url = f"postgresql://***:***@{db_url_parts[1]}"
        else:
            safe_url = "postgresql://***:***@***"
        logger.info(f"Connecting to PostgreSQL database at {safe_url}")
        return engine
    except Exception as e:
        logger.error(f"Error creating database engine: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

# Create engine
engine = get_engine()

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
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