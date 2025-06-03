from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis import Redis
import logging
import traceback
from app.database.database import init_db, check_db_connection
from app.api import products_router, inventory_router, predictions_router
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main router
api_router = APIRouter()

# Add all routers to the main router
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
api_router.include_router(predictions_router, prefix="/predictions", tags=["predictions"])

# Initialize FastAPI app with custom configuration
app = FastAPI(
    title="Inventory Management API",
    description="""
    API for inventory management and demand forecasting.
    
    ## Features
    * Product Management
    * Inventory Tracking
    * Demand Forecasting
    * Inventory Advice
    """,
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8950",
        "http://127.0.0.1:8950",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.onrender.com"  # Allow Render domains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {str(exc)}")
    logger.error(f"Error type: {type(exc).__name__}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    # Check if it's a database connection error
    if "connection" in str(exc).lower():
        return JSONResponse(
            status_code=503,
            content={"detail": "Database connection error. Please try again later."}
        )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "path": request.url.path
        }
    )

# Initialize Redis connection
redis_client = Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Include the main router with /api prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Inventory Management API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_prefix": "/api"
    }

# Initialize database and models on startup
@app.on_event("startup")
async def startup_event():
    try:
        # Check database connection first
        if not check_db_connection():
            logger.error("Database connection failed. Please check your DATABASE_URL environment variable.")
            logger.error(f"Current DATABASE_URL: {os.getenv('DATABASE_URL', 'Not set')}")
            raise Exception("Failed to connect to database. Check logs for details.")
            
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8950) 