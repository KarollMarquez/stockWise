import sys
import os
import subprocess

def main():
    print("🚀 Iniciando la aplicación web de StockWise...")
    # Clean previous processes on port 8000
    subprocess.run("kill $(lsof -t -i :8000) 2>/dev/null || true", shell=True)

    # Run the integrated FastAPI application on Port 8000
    try:
        subprocess.run(["python3", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"])
    except KeyboardInterrupt:
        print("\n👋 StockWise Web finalizada.")

if __name__ == "__main__":
    main()
