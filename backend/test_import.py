#!/usr/bin/env python
"""Minimal test to debug imports."""

print("Step 1: Starting")

try:
    print("Step 2: Importing fastapi")
    from fastapi import FastAPI
    app = FastAPI()
    print("Step 3: FastAPI OK")
except Exception as e:
    print(f"ERROR at step: {e}")
    import traceback
    traceback.print_exc()

print("Done")
