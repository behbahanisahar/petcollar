"""
Vercel Serverless handler - routes all /api/* to FastAPI via Mangum
"""
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
backend = root / "backend"
for p in (str(backend), str(root)):
    if p not in sys.path:
        sys.path.insert(0, p)

from mangum import Mangum
from main import app  # backend/main.py - backend/ is on path

# lifespan="on" so FastAPI runs init_db on cold start
handler = Mangum(app, lifespan="on")
