"""Ensure the worktree's src directory is on sys.path before any test import."""

import sys
from pathlib import Path

_src = str(Path(__file__).parent.parent / "src")
if _src not in sys.path:
    sys.path.insert(0, _src)
