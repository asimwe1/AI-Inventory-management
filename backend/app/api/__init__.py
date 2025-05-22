from .products import router as products_router
from .inventory import router as inventory_router
from .predictions import router as predictions_router

__all__ = ["products_router", "inventory_router", "predictions_router"] 