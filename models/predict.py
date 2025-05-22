import pandas as pd
import numpy as np
from prophet import Prophet
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

class DemandPredictor:
    def __init__(self, model_path, data_path):
        self.model_path = Path(model_path)
        self.data_path = Path(data_path)
        self.models = {}
        self.feature_models = None
        self.scaler = None
        self.latest_data = None
    
    def load_models(self):
        """Load trained models from disk."""
        try:
            # Load Prophet models
            for model_file in self.model_path.glob("prophet_model_*.json"):
                product_id = model_file.stem.split('_')[-1]
                self.models[product_id] = joblib.load(str(model_file))
            
            # Load feature models and scaler
            self.feature_models = joblib.load(self.model_path / "feature_models.joblib")
            self.scaler = joblib.load(self.model_path / "scaler.joblib")
            
            logger.info(f"Loaded models for {len(self.models)} products")
        except FileNotFoundError as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def load_latest_data(self):
        """Load the most recent data for feature-based predictions."""
        try:
            self.latest_data = pd.read_csv(self.data_path / "processed_sales.csv")
            self.latest_data['date'] = pd.to_datetime(self.latest_data['date'])
            logger.info("Loaded latest data for predictions")
        except FileNotFoundError as e:
            logger.error(f"Error loading latest data: {e}")
            raise
    
    def prepare_feature_data(self, product_id, forecast_dates):
        """Prepare feature data for the feature-based model."""
        if self.latest_data is None:
            raise ValueError("Latest data not loaded. Call load_latest_data() first.")
        
        # Get the most recent data point for this product
        latest_product_data = self.latest_data[
            self.latest_data['product_id'] == product_id
        ].iloc[-1]
        
        # Create feature data for future dates
        feature_data = []
        for date in forecast_dates:
            features = {
                'day_of_week': date.dayofweek,
                'month': date.month,
                'year': date.year,
                'is_weekend': int(date.dayofweek >= 5),
                'sales_7d_avg': latest_product_data['sales_7d_avg'],
                'stock_to_sales_ratio': latest_product_data['stock_to_sales_ratio']
            }
            feature_data.append(features)
        
        return pd.DataFrame(feature_data)
    
    def predict_demand(self, product_id, days_ahead=30):
        """Make demand predictions for a specific product."""
        if not self.models or product_id not in self.models:
            raise ValueError(f"No model found for product {product_id}")
        
        # Generate future dates
        last_date = self.latest_data['date'].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )
        
        # Get Prophet predictions
        prophet_forecast = self.models[product_id].predict(
            pd.DataFrame({'ds': future_dates})
        )
        
        # Get feature-based predictions
        feature_data = self.prepare_feature_data(product_id, future_dates)
        feature_data_scaled = self.scaler.transform(feature_data)
        feature_predictions = self.feature_models[product_id].predict(feature_data_scaled)
        
        # Combine predictions (weighted average)
        prophet_weight = 0.7
        feature_weight = 0.3
        
        combined_predictions = (
            prophet_weight * prophet_forecast['yhat'].values +
            feature_weight * feature_predictions
        )
        
        # Create prediction DataFrame
        predictions_df = pd.DataFrame({
            'date': future_dates,
            'prophet_prediction': prophet_forecast['yhat'].values,
            'feature_prediction': feature_predictions,
            'combined_prediction': combined_predictions,
            'prophet_lower': prophet_forecast['yhat_lower'].values,
            'prophet_upper': prophet_forecast['yhat_upper'].values
        })
        
        return predictions_df
    
    def predict_all_products(self, days_ahead=30):
        """Make predictions for all products."""
        if self.latest_data is None:
            self.load_latest_data()
        
        all_predictions = {}
        for product_id in self.models.keys():
            try:
                predictions = self.predict_demand(product_id, days_ahead)
                all_predictions[product_id] = predictions
                logger.info(f"Generated predictions for product {product_id}")
            except Exception as e:
                logger.error(f"Error predicting for product {product_id}: {e}")
                continue
        
        return all_predictions
    
    def save_predictions(self, predictions, output_path):
        """Save predictions to CSV files."""
        output_path = Path(output_path)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save individual product predictions
        for product_id, pred_df in predictions.items():
            file_path = output_path / f"predictions_{product_id}.csv"
            pred_df.to_csv(file_path, index=False)
        
        # Create and save summary
        summary = []
        for product_id, pred_df in predictions.items():
            summary.append({
                'product_id': product_id,
                'avg_predicted_demand': pred_df['combined_prediction'].mean(),
                'min_predicted_demand': pred_df['combined_prediction'].min(),
                'max_predicted_demand': pred_df['combined_prediction'].max(),
                'prediction_confidence': (
                    pred_df['prophet_upper'] - pred_df['prophet_lower']
                ).mean()
            })
        
        summary_df = pd.DataFrame(summary)
        summary_df.to_csv(output_path / "prediction_summary.csv", index=False)
        logger.info(f"Saved predictions to {output_path}")

def main():
    # Initialize predictor
    predictor = DemandPredictor(
        model_path="models/saved",
        data_path="data/processed"
    )
    
    try:
        # Load models and data
        predictor.load_models()
        predictor.load_latest_data()
        
        # Generate predictions
        predictions = predictor.predict_all_products(days_ahead=30)
        
        # Save predictions
        predictor.save_predictions(
            predictions,
            output_path="models/predictions"
        )
        
        logger.info("Prediction generation completed successfully")
    except Exception as e:
        logger.error(f"Error during prediction generation: {e}")
        raise

if __name__ == "__main__":
    main() 