from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
import logging
from database.database import init_db
from api import products_router, inventory_router, predictions_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Inventory Management API",
    description="API for inventory management and demand forecasting",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis connection
redis_client = Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Include routers
app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(predictions_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Inventory Management API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# Initialize database and models on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 