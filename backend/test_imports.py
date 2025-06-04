import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

# Try importing our modules
try:
    from app.main import app
    from app.api import products_router, inventory_router, predictions_router
    print("Successfully imported all modules!")
    print("\nAvailable routes:")
    for route in app.routes:
        print(f"{route.methods} {route.path}")
except Exception as e:
    print(f"Error importing modules: {e}")
    print("\nPython path:")
    for path in sys.path:
        print(path) 