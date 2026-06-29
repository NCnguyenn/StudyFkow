import sys
import os

# Clean sys.path to prevent double-importing backend modules
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
sys.path = [p for p in sys.path if not p.endswith("backend") and not p.endswith("backend/features") and "backend\\features" not in p and "backend/features" not in p]
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
