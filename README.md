# AI-Driven Inventory Management System

An intelligent inventory management system that uses machine learning to predict product demand and optimize stock levels for zedi.rw.

## Project Overview

This system helps reduce stockouts and overstock situations by predicting future product demand based on historical sales data. It consists of four main layers:

1. **Data Layer**: Manages data collection, storage, and preprocessing
2. **Model Layer**: Contains the machine learning models for demand forecasting
3. **Backend Layer**: Provides API endpoints for model interaction
4. **Frontend Layer**: Offers an intuitive dashboard for users

## Project Structure

```
AI_driven_Inventory/
├── data/                   # Data storage and processing
│   ├── raw/               # Raw historical data
│   ├── processed/         # Cleaned and processed data
│   └── mock_data.py       # Script to generate mock data
├── models/                # ML model implementation
│   ├── train.py          # Model training scripts
│   └── predict.py        # Prediction utilities
├── backend/              # FastAPI backend
│   ├── api/             # API endpoints
│   └── main.py          # FastAPI application
├── frontend/            # React frontend
│   ├── src/            # Source code
│   └── public/         # Static assets
├── requirements.txt     # Python dependencies
└── README.md           # Project documentation
```

## Setup Instructions

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Generate mock data:
   ```bash
   python data/mock_data.py
   ```

4. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

5. Start the frontend development server:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Technology Stack

- **Data Processing**: Python, Pandas, NumPy
- **Machine Learning**: Scikit-learn, Prophet, XGBoost
- **Backend**: FastAPI, SQLite (development) / PostgreSQL (production)
- **Frontend**: React, Tailwind CSS
- **Deployment**: Docker (planned)

## Development Status

Currently in initial development phase. Features implemented:
- [x] Project structure setup
- [ ] Mock data generation
- [ ] Data cleaning pipeline
- [ ] Basic ML model implementation
- [ ] Backend API endpoints
- [ ] Frontend dashboard

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

MADE BY @CAL250