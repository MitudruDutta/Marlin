#!/usr/bin/env python3
"""
Marlin AI Agent Startup Script

This script provides an easy way to start the AI agent with proper configuration
and error handling.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 9):
        print("Error: Python 3.9 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    return True

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        "fastapi",
        "uvicorn", 
        "httpx",
        "numpy",
        "sklearn",
        "dotenv",
        "pydantic"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("Error: Missing required packages:")
        for package in missing_packages:
            print(f"  - {package}")
        print("\nInstall them with: pip install -r requirements.txt")
        return False
    
    return True

def check_environment():
    """Check environment configuration"""
    env_file = Path(".env")
    if not env_file.exists():
        print("Warning: .env file not found")
        print("Copy env.example to .env and configure your settings")
        return False
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check for Gemini API key (optional but recommended)
    if not os.getenv("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY not set")
        print("AI narratives will be disabled")
    
    return True

def run_tests():
    """Run integration tests"""
    print("Running integration tests...")
    try:
        result = subprocess.run([sys.executable, "test_integration.py"], 
                              capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✓ Integration tests passed")
            return True
        else:
            print("⚠ Some integration tests failed")
            print("The server may still work with limited functionality")
            return True  # Allow startup even with test failures
    except subprocess.TimeoutExpired:
        print("⚠ Integration tests timed out")
        return True
    except Exception as e:
        print(f"⚠ Could not run integration tests: {e}")
        return True

def start_server(host="0.0.0.0", port=8000, reload=True):
    """Start the FastAPI server"""
    print(f"Starting Marlin AI Agent on {host}:{port}")
    print(f"API docs will be available at: http://localhost:{port}/docs")
    print("Press Ctrl+C to stop the server")
    
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "main:app",
        "--host", host,
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")

def main():
    """Main startup function"""
    print("=" * 50)
    print("Marlin AI Agent Startup")
    print("=" * 50)
    
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    # Run checks
    if not check_python_version():
        sys.exit(1)
    
    if not check_dependencies():
        print("\nTrying to install dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                         check=True)
            print("✓ Dependencies installed")
        except subprocess.CalledProcessError:
            print("✗ Failed to install dependencies")
            sys.exit(1)
    
    if not check_environment():
        print("\nContinuing with default configuration...")
    
    # Run tests
    if "--skip-tests" not in sys.argv:
        run_tests()
    
    # Parse command line arguments
    host = "0.0.0.0"
    port = 8000
    reload = True
    
    for arg in sys.argv[1:]:
        if arg.startswith("--host="):
            host = arg.split("=", 1)[1]
        elif arg.startswith("--port="):
            port = int(arg.split("=", 1)[1])
        elif arg == "--no-reload":
            reload = False
    
    # Start server
    start_server(host, port, reload)

if __name__ == "__main__":
    main()
