import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self, raw_data_path, processed_data_path):
        self.raw_data_path = Path(raw_data_path)
        self.processed_data_path = Path(processed_data_path)
        self.sales_df = None
        self.products_df = None
    
    def load_data(self):
        """Load raw sales and product data."""
        try:
            self.sales_df = pd.read_csv(self.raw_data_path / "sales.csv")
            self.products_df = pd.read_csv(self.raw_data_path / "products.csv")
            logger.info(f"Loaded {len(self.sales_df)} sales records and {len(self.products_df)} products")
        except FileNotFoundError as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def clean_sales_data(self):
        """Clean and preprocess sales data."""
        if self.sales_df is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        # Convert date column to datetime
        self.sales_df['date'] = pd.to_datetime(self.sales_df['date'])
        
        # Remove any future dates
        current_date = datetime.now()
        self.sales_df = self.sales_df[self.sales_df['date'] <= current_date]
        
        # Remove negative sales quantities
        self.sales_df = self.sales_df[self.sales_df['sales_quantity'] >= 0]
        
        # Remove negative stock levels
        self.sales_df = self.sales_df[self.sales_df['stock_level'] >= 0]
        
        # Remove any rows with missing values
        self.sales_df = self.sales_df.dropna()
        
        # Sort by product_id and date
        self.sales_df = self.sales_df.sort_values(['product_id', 'date'])
        
        # Add additional features
        self._add_features()
        
        logger.info(f"Cleaned data shape: {self.sales_df.shape}")
        return self.sales_df
    
    def _add_features(self):
        """Add derived features to the dataset."""
        # Add day of week
        self.sales_df['day_of_week'] = self.sales_df['date'].dt.dayofweek
        
        # Add month
        self.sales_df['month'] = self.sales_df['date'].dt.month
        
        # Add year
        self.sales_df['year'] = self.sales_df['date'].dt.year
        
        # Add is_weekend flag
        self.sales_df['is_weekend'] = self.sales_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Add rolling averages for sales
        self.sales_df['sales_7d_avg'] = self.sales_df.groupby('product_id')['sales_quantity'].transform(
            lambda x: x.rolling(window=7, min_periods=1).mean()
        )
        
        # Add stock-to-sales ratio
        self.sales_df['stock_to_sales_ratio'] = (
            self.sales_df['stock_level'] / (self.sales_df['sales_quantity'] + 1)
        )
    
    def save_processed_data(self):
        """Save processed data to CSV files."""
        if self.sales_df is None:
            raise ValueError("No processed data available. Call clean_sales_data() first.")
        
        # Create processed directory if it doesn't exist
        self.processed_data_path.mkdir(parents=True, exist_ok=True)
        
        # Save processed sales data
        output_file = self.processed_data_path / "processed_sales.csv"
        self.sales_df.to_csv(output_file, index=False)
        logger.info(f"Saved processed data to {output_file}")
        
        # Save summary statistics
        self._save_summary_stats()
    
    def _save_summary_stats(self):
        """Generate and save summary statistics for the dataset."""
        summary_stats = {
            'total_products': len(self.products_df),
            'total_sales_records': len(self.sales_df),
            'date_range': {
                'start': self.sales_df['date'].min(),
                'end': self.sales_df['date'].max()
            },
            'avg_daily_sales': self.sales_df.groupby('product_id')['sales_quantity'].mean().mean(),
            'total_sales_quantity': self.sales_df['sales_quantity'].sum(),
            'avg_stock_level': self.sales_df['stock_level'].mean()
        }
        
        # Save summary statistics to a text file
        with open(self.processed_data_path / "summary_stats.txt", 'w') as f:
            for key, value in summary_stats.items():
                f.write(f"{key}: {value}\n")
        
        logger.info("Saved summary statistics")

def main():
    # Initialize data cleaner
    cleaner = DataCleaner(
        raw_data_path="data/raw",
        processed_data_path="data/processed"
    )
    
    try:
        # Load and process data
        cleaner.load_data()
        cleaner.clean_sales_data()
        cleaner.save_processed_data()
        logger.info("Data cleaning completed successfully")
    except Exception as e:
        logger.error(f"Error during data cleaning: {e}")
        raise

if __name__ == "__main__":
    main() 