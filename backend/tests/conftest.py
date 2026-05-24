import sys
import os

# ensure "backend/src" is on the path so `from app.main import app` resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)
