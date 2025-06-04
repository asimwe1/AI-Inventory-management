import pandas as pd
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_current_stock():
    """Generate current stock levels from the latest sales data."""
    try:
        # Read the processed sales data
        sales_df = pd.read_csv("data/processed/processed_sales.csv")
        sales_df['date'] = pd.to_datetime(sales_df['date'])
        
        # Get the latest stock level for each product
        latest_stock = sales_df.sort_values('date').groupby('product_id').last()
        current_stock_df = latest_stock[['stock_level']].reset_index()
        current_stock_df.columns = ['product_id', 'current_stock']
        
        # Save to CSV
        output_path = Path("data/current_stock.csv")
        current_stock_df.to_csv(output_path, index=False)
        logger.info(f"Generated current stock levels for {len(current_stock_df)} products")
        
    except Exception as e:
        logger.error(f"Error generating current stock levels: {e}")
        raise

if __name__ == "__main__":
    generate_current_stock() 