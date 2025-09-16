"""
Test script to verify AI Agent integration and setup
"""

import os
import sys
import asyncio
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

async def test_basic_imports():
    """Test that all modules can be imported"""
    print("Testing basic imports...")
    
    try:
        from main import app
        print("✓ FastAPI app imported successfully")
    except Exception as e:
        print(f"✗ Failed to import FastAPI app: {e}")
        return False
    
    try:
        from lstm import train_from_prices, predict_next_price
        print("✓ LSTM module imported successfully")
    except Exception as e:
        print(f"✗ Failed to import LSTM module: {e}")
        return False
    
    try:
        from defillama import router
        print("✓ DeFiLlama module imported successfully")
    except Exception as e:
        print(f"✗ Failed to import DeFiLlama module: {e}")
        return False
    
    try:
        from algorand_integration import AlgorandClient, ContractManager
        print("✓ Algorand integration imported successfully")
    except Exception as e:
        print(f"✗ Failed to import Algorand integration: {e}")
        return False
    
    return True

async def test_environment_config():
    """Test environment configuration"""
    print("\nTesting environment configuration...")
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check critical environment variables
    network = os.getenv("NETWORK", "testnet")
    algod_address = os.getenv("ALGOD_ADDRESS")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    print(f"Network: {network}")
    print(f"Algod Address: {algod_address or 'Using default'}")
    print(f"Gemini API Key: {'✓ Set' if gemini_key else '✗ Not set (AI narratives will be disabled)'}")
    
    # Check contract app IDs
    contract_names = [
        "YIELD_TOKENIZATION", "PT_TOKEN", "YT_TOKEN", "SIMPLE_AMM",
        "STAKING_DAPP", "PRICE_ORACLE", "STANDARDIZED_WRAPPER", "YT_AUTO_CONVERTER"
    ]
    
    contracts_configured = 0
    for contract in contract_names:
        app_id = os.getenv(f"{contract}_APP_ID")
        if app_id:
            contracts_configured += 1
    
    print(f"Smart contracts configured: {contracts_configured}/{len(contract_names)}")
    if contracts_configured == 0:
        print("  Note: No contracts configured. Contract features will be disabled.")
    
    return True

async def test_algorand_connection():
    """Test Algorand network connection"""
    print("\nTesting Algorand connection...")
    
    try:
        from algorand_integration import AlgorandClient
        
        network = os.getenv("NETWORK", "testnet")
        algod_address = os.getenv("ALGOD_ADDRESS")
        algod_token = os.getenv("ALGOD_TOKEN", "")
        
        client = AlgorandClient(
            network=network,
            algod_address=algod_address,
            algod_token=algod_token
        )
        
        # Test connection by getting network status
        status = client.algod_client.status()
        print(f"✓ Connected to Algorand {network}")
        print(f"  Last round: {status.get('last-round', 'Unknown')}")
        print(f"  Time since last round: {status.get('time-since-last-round', 'Unknown')}ms")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to connect to Algorand: {e}")
        print("  This is expected if running without proper Algorand configuration")
        return False

async def test_price_data():
    """Test price data fetching"""
    print("\nTesting price data fetching...")
    
    try:
        # Import the price functions
        sys.path.append(str(Path(__file__).parent))
        from main import get_coin_data
        
        # Test fetching Bitcoin price data
        coin_data = await get_coin_data("bitcoin")
        
        if coin_data and coin_data.get("current_price"):
            print(f"✓ Price data fetched successfully")
            print(f"  Bitcoin price: ${coin_data['current_price']:,.2f}")
            print(f"  24h change: {coin_data.get('price_change_percentage_24h_in_currency', 'N/A'):.2f}%")
            return True
        else:
            print("✗ No price data returned")
            return False
            
    except Exception as e:
        print(f"✗ Failed to fetch price data: {e}")
        return False

async def test_ml_model():
    """Test ML model functionality"""
    print("\nTesting ML model...")
    
    try:
        import numpy as np
        from lstm import train_from_prices, predict_next_price
        
        # Create sample price data
        np.random.seed(42)
        days = 100
        prices = 100 * np.exp(np.cumsum(np.random.randn(days) * 0.02))
        
        # Train model
        model = train_from_prices(prices, window=30)
        print("✓ Model trained successfully")
        
        # Make prediction
        last_prices = prices[-31:]  # 30 + 1 for prediction
        prediction = predict_next_price(model, last_prices, window=30)
        
        print(f"✓ Prediction made successfully")
        print(f"  Last price: ${last_prices[-1]:.2f}")
        print(f"  Predicted price: ${prediction:.2f}")
        print(f"  Predicted change: {((prediction - last_prices[-1]) / last_prices[-1] * 100):+.2f}%")
        
        return True
        
    except Exception as e:
        print(f"✗ ML model test failed: {e}")
        return False

async def test_api_endpoints():
    """Test API endpoints"""
    print("\nTesting API endpoints...")
    
    try:
        import httpx
        from main import app
        
        # Test health endpoint  
        from fastapi.testclient import TestClient
        test_client = TestClient(app)
        response = test_client.get("/health")
        
        if response.status_code == 200:
            health_data = response.json()
            print("✓ Health endpoint working")
            print(f"  Model ready: {health_data.get('model_ready', False)}")
            print(f"  Algorand ready: {health_data.get('algorand_ready', False)}")
            print(f"  Network: {health_data.get('network', 'Unknown')}")
            return True
        else:
            print(f"✗ Health endpoint failed: {response.status_code}")
            return False
                
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 50)
    print("Marlin AI Agent Integration Test")
    print("=" * 50)
    
    tests = [
        ("Basic Imports", test_basic_imports),
        ("Environment Config", test_environment_config),
        ("Algorand Connection", test_algorand_connection),
        ("Price Data", test_price_data),
        ("ML Model", test_ml_model),
        ("API Endpoints", test_api_endpoints),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print(f"\nPassed: {passed}/{len(tests)}")
    
    if passed == len(tests):
        print("\n🎉 All tests passed! Your AI Agent is ready to use.")
    elif passed >= len(tests) - 2:
        print("\n✅ Most tests passed. Minor configuration issues detected.")
        print("   Check the failed tests above and update your configuration.")
    else:
        print("\n⚠️  Several tests failed. Please check your setup:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Configure environment: copy env.example to .env")
        print("   3. Set GEMINI_API_KEY in your .env file")
        print("   4. Check network connectivity")

if __name__ == "__main__":
    asyncio.run(main())
