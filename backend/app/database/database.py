from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging
from sqlalchemy.exc import SQLAlchemyError

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database URL from environment variable
# Default to SQLite for development if not set
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./inventory.db"
)

# Configure PostgreSQL connection pool
POSTGRES_POOL_SIZE = int(os.getenv("POSTGRES_POOL_SIZE", "5"))
POSTGRES_MAX_OVERFLOW = int(os.getenv("POSTGRES_MAX_OVERFLOW", "10"))
POSTGRES_POOL_TIMEOUT = int(os.getenv("POSTGRES_POOL_TIMEOUT", "30"))

def get_engine():
    """Create and return a database engine with appropriate configuration."""
    try:
        if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
            # PostgreSQL configuration
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_size=POSTGRES_POOL_SIZE,
                max_overflow=POSTGRES_MAX_OVERFLOW,
                pool_timeout=POSTGRES_POOL_TIMEOUT,
                pool_pre_ping=True,  # Enable connection health checks
                echo=os.getenv("DEBUG", "False").lower() == "true"
            )
            logger.info("Connected to PostgreSQL database")
        else:
            # SQLite configuration (for development)
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                connect_args={"check_same_thread": False}
            )
            logger.info("Connected to SQLite database (development mode)")

        return engine
    except Exception as e:
        logger.error(f"Error creating database engine: {e}")
        raise

# Create engine
engine = get_engine()

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

@contextmanager
def get_db():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error: {e}")
        raise
    finally:
        db.close()

def init_db():
    """Initialize the database, creating all tables."""
    try:
        from .models import Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
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