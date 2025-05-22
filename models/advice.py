import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from models.predict import DemandPredictor

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InventoryAdvisor:
    def __init__(self, model_path="models/saved", data_path="data/processed"):
        self.predictor = DemandPredictor(model_path=model_path, data_path=data_path)
        self.current_stock_path = Path("data/current_stock.csv")
        self.lead_time_days = 7  # Supplier lead time
        self.safety_stock_days = 5  # Days of extra stock as buffer
        self.min_order_quantity = 5  # Minimum order quantity
        self.max_order_quantity = 200  # Maximum order quantity
        
    def load_current_stock(self):
        """Load current stock levels."""
        try:
            stock_df = pd.read_csv(self.current_stock_path)
            return dict(zip(stock_df['product_id'], stock_df['current_stock']))
        except Exception as e:
            logger.error(f"Could not load current stock: {e}")
            return {}
    
    def calculate_reorder_point(self, predictions_df):
        """Calculate reorder point based on predicted demand."""
        # Calculate demand during lead time + safety stock period
        lead_time_demand = predictions_df['combined_prediction'].head(
            self.lead_time_days + self.safety_stock_days
        ).sum()
        
        # Add some buffer based on prediction uncertainty
        uncertainty = (
            predictions_df['prophet_upper'] - predictions_df['prophet_lower']
        ).head(self.lead_time_days + self.safety_stock_days).mean()
        
        return lead_time_demand + (uncertainty * 0.5)  # Use 50% of uncertainty as buffer
    
    def calculate_order_quantity(self, reorder_point, current_stock):
        """Calculate optimal order quantity."""
        order_qty = max(0, reorder_point - current_stock)
        
        # Apply minimum and maximum order quantities
        order_qty = max(self.min_order_quantity, order_qty)
        order_qty = min(self.max_order_quantity, order_qty)
        
        return int(round(order_qty))
    
    def generate_advice(self):
        """Generate comprehensive inventory advice."""
        try:
            # Load models and data
            self.predictor.load_models()
            self.predictor.load_latest_data()
            current_stock = self.load_current_stock()
            
            # Generate predictions for all products
            predictions = self.predictor.predict_all_products(
                days_ahead=self.lead_time_days + self.safety_stock_days + 30  # Extra days for analysis
            )
            
            advice_list = []
            for product_id, pred_df in predictions.items():
                # Calculate reorder point
                reorder_point = self.calculate_reorder_point(pred_df)
                current_stock_level = current_stock.get(product_id, 0)
                
                # Calculate order quantity
                order_qty = self.calculate_order_quantity(reorder_point, current_stock_level)
                
                # Calculate stock coverage (days of stock remaining)
                daily_demand = pred_df['combined_prediction'].mean()
                days_of_stock = current_stock_level / daily_demand if daily_demand > 0 else float('inf')
                
                # Generate advice
                if order_qty > 0:
                    urgency = "HIGH" if days_of_stock < self.lead_time_days else "MEDIUM"
                    advice = f"Order {order_qty} units of {product_id}"
                    reason = f"Current stock ({current_stock_level}) is below reorder point ({int(reorder_point)})"
                else:
                    urgency = "LOW"
                    advice = f"No immediate order needed for {product_id}"
                    reason = f"Current stock ({current_stock_level}) is sufficient"
                
                advice_list.append({
                    'product_id': product_id,
                    'current_stock': current_stock_level,
                    'reorder_point': int(reorder_point),
                    'order_quantity': order_qty,
                    'days_of_stock': round(days_of_stock, 1),
                    'urgency': urgency,
                    'advice': advice,
                    'reason': reason,
                    'avg_daily_demand': round(daily_demand, 1),
                    'prediction_confidence': round(
                        (pred_df['prophet_upper'] - pred_df['prophet_lower']).mean(),
                        1
                    )
                })
            
            # Convert to DataFrame and save
            advice_df = pd.DataFrame(advice_list)
            advice_df.to_csv(self.predictor.model_path / "inventory_advice.csv", index=False)
            
            # Generate summary
            summary = {
                'total_products': len(advice_df),
                'products_to_order': len(advice_df[advice_df['order_quantity'] > 0]),
                'high_urgency': len(advice_df[advice_df['urgency'] == 'HIGH']),
                'medium_urgency': len(advice_df[advice_df['urgency'] == 'MEDIUM']),
                'low_urgency': len(advice_df[advice_df['urgency'] == 'LOW']),
                'total_order_quantity': advice_df['order_quantity'].sum(),
                'avg_days_of_stock': advice_df['days_of_stock'].mean()
            }
            
            # Save summary
            pd.DataFrame([summary]).to_csv(
                self.predictor.model_path / "inventory_advice_summary.csv",
                index=False
            )
            
            logger.info("Generated comprehensive inventory advice")
            return advice_df, summary
            
        except Exception as e:
            logger.error(f"Error generating inventory advice: {e}")
            raise

def main():
    advisor = InventoryAdvisor()
    advice_df, summary = advisor.generate_advice()
    
    # Print summary
    logger.info("\nInventory Advice Summary:")
    logger.info(f"Total Products: {summary['total_products']}")
    logger.info(f"Products to Order: {summary['products_to_order']}")
    logger.info(f"High Urgency Orders: {summary['high_urgency']}")
    logger.info(f"Medium Urgency Orders: {summary['medium_urgency']}")
    logger.info(f"Low Urgency Orders: {summary['low_urgency']}")
    logger.info(f"Total Order Quantity: {summary['total_order_quantity']}")
    logger.info(f"Average Days of Stock: {summary['avg_days_of_stock']:.1f}")
    
    # Print high urgency orders
    high_urgency = advice_df[advice_df['urgency'] == 'HIGH']
    if not high_urgency.empty:
        logger.info("\nHigh Urgency Orders:")
        for _, row in high_urgency.iterrows():
            logger.info(
                f"{row['product_id']}: Order {row['order_quantity']} units "
                f"(Current: {row['current_stock']}, Days of Stock: {row['days_of_stock']})"
            )

if __name__ == "__main__":
    main() 