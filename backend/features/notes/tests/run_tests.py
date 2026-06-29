import sys
import os

# Ensure the workspace root is the first entry in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Prevent pytest from doing double-imports by force-removing "backend" subpaths from sys.path
sys.path = [p for p in sys.path if "backend\\features" not in p and "backend/features" not in p]

# Clear SQLAlchemy metadata to avoid duplicate table definitions
from backend.app.core.base import Base
Base.metadata.clear()

import pytest

if __name__ == "__main__":
    # Execute pytest on the unit tests directory
    test_dir = os.path.dirname(__file__)
    sys.exit(pytest.main(["-v", test_dir]))
