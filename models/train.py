import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import joblib
from pathlib import Path
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DemandForecaster:
    def __init__(self, data_path, model_path):
        self.data_path = Path(data_path)
        self.model_path = Path(model_path)
        self.model_path.mkdir(parents=True, exist_ok=True)
        self.scaler = StandardScaler()
        self.models = {}  # Dictionary to store models for each product
        self.feature_models = {}  # Dictionary to store feature-based models
    
    def load_data(self):
        """Load processed sales data."""
        try:
            self.data = pd.read_csv(self.data_path / "processed_sales.csv")
            self.data['date'] = pd.to_datetime(self.data['date'])
            logger.info(f"Loaded {len(self.data)} records")
        except FileNotFoundError as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def prepare_prophet_data(self, product_data):
        """Prepare data for Prophet model."""
        prophet_data = product_data[['date', 'sales_quantity']].copy()
        prophet_data.columns = ['ds', 'y']
        return prophet_data
    
    def prepare_feature_data(self, product_data):
        """Prepare data for feature-based model."""
        features = [
            'day_of_week', 'month', 'year', 'is_weekend',
            'sales_7d_avg', 'stock_to_sales_ratio'
        ]
        X = product_data[features].copy()
        y = product_data['sales_quantity']
        return X, y
    
    def train_models(self):
        """Train forecasting models for each product."""
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        # Get unique products
        products = self.data['product_id'].unique()
        
        for product_id in products:
            logger.info(f"Training models for product {product_id}")
            product_data = self.data[self.data['product_id'] == product_id].copy()
            
            # Train Prophet model
            prophet_data = self.prepare_prophet_data(product_data)
            prophet_model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )
            prophet_model.fit(prophet_data)
            self.models[product_id] = prophet_model
            
            # Train feature-based model
            X, y = self.prepare_feature_data(product_data)
            X_scaled = self.scaler.fit_transform(X)
            feature_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            feature_model.fit(X_scaled, y)
            self.feature_models[product_id] = feature_model
        
        logger.info(f"Trained models for {len(products)} products")
    
    def save_models(self):
        """Save trained models to disk."""
        if not self.models:
            raise ValueError("No models trained. Call train_models() first.")
        
        # Save Prophet models
        for product_id, model in self.models.items():
            model_path = self.model_path / f"prophet_model_{product_id}.json"
            model.save(str(model_path))
        
        # Save feature models and scaler
        joblib.dump(self.feature_models, self.model_path / "feature_models.joblib")
        joblib.dump(self.scaler, self.model_path / "scaler.joblib")
        
        logger.info("Saved all models to disk")
    
    def evaluate_models(self, test_days=30):
        """Evaluate models on recent data."""
        if not self.models:
            raise ValueError("No models trained. Call train_models() first.")
        
        results = []
        cutoff_date = self.data['date'].max() - timedelta(days=test_days)
        
        for product_id in self.models.keys():
            # Prepare test data
            test_data = self.data[
                (self.data['product_id'] == product_id) &
                (self.data['date'] > cutoff_date)
            ].copy()
            
            if len(test_data) == 0:
                continue
            
            # Make predictions
            prophet_forecast = self.models[product_id].predict(
                pd.DataFrame({'ds': test_data['date']})
            )
            
            X_test, y_test = self.prepare_feature_data(test_data)
            X_test_scaled = self.scaler.transform(X_test)
            feature_predictions = self.feature_models[product_id].predict(X_test_scaled)
            
            # Calculate metrics
            actual = test_data['sales_quantity'].values
            prophet_mae = np.mean(np.abs(prophet_forecast['yhat'] - actual))
            feature_mae = np.mean(np.abs(feature_predictions - actual))
            
            results.append({
                'product_id': product_id,
                'prophet_mae': prophet_mae,
                'feature_mae': feature_mae,
                'test_size': len(test_data)
            })
        
        # Convert results to DataFrame and save
        results_df = pd.DataFrame(results)
        results_df.to_csv(self.model_path / "model_evaluation.csv", index=False)
        
        # Log average performance
        avg_prophet_mae = results_df['prophet_mae'].mean()
        avg_feature_mae = results_df['feature_mae'].mean()
        logger.info(f"Average Prophet MAE: {avg_prophet_mae:.2f}")
        logger.info(f"Average Feature Model MAE: {avg_feature_mae:.2f}")
        
        return results_df

def main():
    # Initialize forecaster
    forecaster = DemandForecaster(
        data_path="data/processed",
        model_path="models/saved"
    )
    
    try:
        # Load data and train models
        forecaster.load_data()
        forecaster.train_models()
        
        # Evaluate models
        evaluation_results = forecaster.evaluate_models()
        
        # Save models
        forecaster.save_models()
        
        logger.info("Model training and evaluation completed successfully")
    except Exception as e:
        logger.error(f"Error during model training: {e}")
        raise

if __name__ == "__main__":
    main() 