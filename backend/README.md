# Inventory Management Backend

This is the backend service for the AI-driven Inventory Management system. It provides APIs for demand forecasting and inventory management using machine learning models.

## Features

- Demand forecasting using Prophet and custom ML models
- Inventory management advice
- Redis caching for improved performance
- RESTful API endpoints
- CORS support for frontend integration
- Comprehensive error handling and logging

## Prerequisites

- Python 3.8+
- Redis server
- PostgreSQL (for production)
- Virtual environment (recommended)

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the backend directory with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
REDIS_URL=redis://localhost:6379/0
MODEL_PATH=models/saved
DATA_PATH=data/processed
```

4. Start Redis server:
```bash
# On Windows
redis-server

# On Linux/Mac
sudo service redis-server start
```

## Running the Application

1. Start the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Access the API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### GET /
- Welcome message and API status

### GET /products
- List all available products

### POST /predict
- Generate demand predictions for a product
- Request body:
  ```json
  {
    "product_id": "string",
    "days_ahead": 30
  }
  ```

### POST /inventory/advice
- Get inventory management advice
- Request body:
  ```json
  {
    "product_id": "string",
    "current_stock": 0
  }
  ```

## Development

### Project Structure
```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── models/           # ML models and prediction logic
│   ├── database/         # Database models and connections
│   └── utils/            # Utility functions
├── data/
│   ├── raw/             # Raw data files
│   └── processed/       # Processed data files
├── models/
│   └── saved/           # Saved ML models
├── tests/               # Test files
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Running Tests
```bash
pytest
```

### Code Style
The project follows PEP 8 guidelines. Use black for code formatting:
```bash
black .
```

## Production Deployment

For production deployment:

1. Set appropriate CORS origins in `main.py`
2. Use a production-grade ASGI server (e.g., Gunicorn)
3. Set up proper database credentials
4. Configure Redis for production
5. Set up proper logging
6. Use environment variables for sensitive data

## License

MIT License 