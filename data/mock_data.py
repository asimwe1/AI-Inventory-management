import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from pathlib import Path

def generate_product_catalog(num_products=50):
    """Generate a catalog of products with realistic names and categories."""
    categories = ['Electronics', 'Clothing', 'Food', 'Home Goods', 'Beauty']
    brands = ['Zedi', 'Premium', 'Basic', 'Elite', 'Standard']
    
    products = []
    for i in range(num_products):
        category = random.choice(categories)
        brand = random.choice(brands)
        product_id = f"PRD{i+1:03d}"
        product_name = f"{brand} {category} Item {i+1}"
        base_price = round(random.uniform(10.0, 1000.0), 2)
        products.append({
            'product_id': product_id,
            'product_name': product_name,
            'category': category,
            'brand': brand,
            'base_price': base_price
        })
    
    return pd.DataFrame(products)

def generate_sales_data(products_df, start_date, end_date):
    """Generate realistic sales data with seasonal patterns and trends."""
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    sales_data = []
    
    for _, product in products_df.iterrows():
        # Base daily sales with some randomness
        base_daily_sales = random.randint(1, 10)
        
        # Add seasonal patterns (higher sales on weekends and holidays)
        for date in dates:
            # Weekend effect
            weekend_multiplier = 1.5 if date.weekday() >= 5 else 1.0
            
            # Monthly seasonality (higher sales at month end)
            month_end_multiplier = 1.3 if date.day >= 25 else 1.0
            
            # Random daily variation
            daily_variation = random.uniform(0.8, 1.2)
            
            # Calculate final sales quantity
            sales_quantity = int(base_daily_sales * weekend_multiplier * 
                               month_end_multiplier * daily_variation)
            
            # Add some noise
            sales_quantity = max(0, sales_quantity + random.randint(-2, 2))
            
            # Generate stock level (current stock - sales + new stock)
            stock_level = random.randint(10, 100)
            new_stock = random.randint(5, 20) if stock_level < 20 else 0
            stock_level = max(0, stock_level - sales_quantity + new_stock)
            
            sales_data.append({
                'product_id': product['product_id'],
                'date': date,
                'sales_quantity': sales_quantity,
                'stock_level': stock_level,
                'price': round(product['base_price'] * random.uniform(0.9, 1.1), 2)
            })
    
    return pd.DataFrame(sales_data)

def main():
    # Create necessary directories
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    
    # Generate data
    start_date = datetime.now() - timedelta(days=365)  # 1 year of historical data
    end_date = datetime.now()
    
    # Generate product catalog
    products_df = generate_product_catalog()
    products_df.to_csv("data/raw/products.csv", index=False)
    print("Generated product catalog with", len(products_df), "products")
    
    # Generate sales data
    sales_df = generate_sales_data(products_df, start_date, end_date)
    sales_df.to_csv("data/raw/sales.csv", index=False)
    print("Generated sales data with", len(sales_df), "records")
    
    # Basic data cleaning
    sales_df['date'] = pd.to_datetime(sales_df['date'])
    sales_df = sales_df.sort_values(['product_id', 'date'])
    
    # Save processed data
    sales_df.to_csv("data/processed/cleaned_sales.csv", index=False)
    print("Saved cleaned sales data")

if __name__ == "__main__":
    main() 