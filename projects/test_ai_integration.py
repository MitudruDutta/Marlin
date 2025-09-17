#!/usr/bin/env python3
"""
Test script to verify AI Agent integration with the dashboard.
Run this script to check if all components are working correctly.
"""

import requests
import time
import json
import sys
from typing import Dict, Any

# Configuration
AI_AGENT_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_ai_agent_health() -> bool:
    """Test AI agent health endpoint"""
    try:
        response = requests.get(f"{AI_AGENT_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Agent health check passed")
            print(f"   - Model ready: {data.get('model_ready', False)}")
            print(f"   - Algorand ready: {data.get('algorand_ready', False)}")
            print(f"   - Network: {data.get('network', 'unknown')}")
            return True
        else:
            print(f"❌ AI Agent health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI Agent health check failed: {e}")
        return False

def test_coin_data() -> bool:
    """Test coin data endpoint"""
    try:
        response = requests.get(f"{AI_AGENT_URL}/coins/algorand", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Coin data endpoint working")
            print(f"   - Current price: ${data.get('current_price', 'N/A')}")
            print(f"   - 24h change: {data.get('price_change_percentage_24h_in_currency', 'N/A')}%")
            return True
        else:
            print(f"❌ Coin data endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Coin data endpoint failed: {e}")
        return False

def test_optimization() -> bool:
    """Test optimization endpoint"""
    try:
        payload = {
            "coin_id": "algorand",
            "risk_profile": "moderate",
            "maturity_months": 6,
            "amount_algo": 1000
        }
        response = requests.post(f"{AI_AGENT_URL}/optimize", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✅ Optimization endpoint working")
            split = data.get('recommended_split', {})
            print(f"   - PT allocation: {split.get('PT', 0) * 100:.1f}%")
            print(f"   - YT allocation: {split.get('YT', 0) * 100:.1f}%")
            return True
        else:
            print(f"❌ Optimization endpoint failed: {response.status_code}")
            if response.status_code == 503:
                print("   - Model not ready, try again after training completes")
            return False
    except Exception as e:
        print(f"❌ Optimization endpoint failed: {e}")
        return False

def test_contract_status() -> bool:
    """Test contract status endpoint"""
    try:
        response = requests.get(f"{AI_AGENT_URL}/contracts/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Contract status endpoint working")
            print(f"   - Network: {data.get('network', 'unknown')}")
            print(f"   - Connected contracts: {data.get('connected_contracts', 0)}/{data.get('total_contracts', 0)}")
            return True
        else:
            print(f"❌ Contract status endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Contract status endpoint failed: {e}")
        return False

def test_frontend_api() -> bool:
    """Test frontend API integration"""
    try:
        # Test the AI agent API route through frontend
        payload = {"action": "coin_data", "coin_id": "algorand"}
        response = requests.post(f"{FRONTEND_URL}/api/ai-agent", json=payload, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Frontend API integration working")
                return True
            else:
                print(f"❌ Frontend API returned error: {data.get('error', 'Unknown')}")
                return False
        else:
            print(f"❌ Frontend API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend API test failed: {e}")
        print("   - Make sure the frontend is running on http://localhost:3000")
        return False

def test_streaming_endpoint() -> bool:
    """Test streaming endpoint (basic connectivity)"""
    try:
        response = requests.get(f"{FRONTEND_URL}/api/ai-agent/stream", timeout=5, stream=True)
        if response.status_code == 200:
            print("✅ Streaming endpoint accessible")
            return True
        else:
            print(f"❌ Streaming endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Streaming endpoint test failed: {e}")
        return False

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print("🧪 Running AI Integration Tests...\n")
    print("=" * 50)
    
    tests = [
        ("AI Agent Health", test_ai_agent_health),
        ("Coin Data", test_coin_data),
        ("AI Optimization", test_optimization),
        ("Contract Status", test_contract_status),
        ("Frontend API", test_frontend_api),
        ("Streaming Endpoint", test_streaming_endpoint),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔬 Testing {test_name}...")
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)  # Brief pause between tests
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} | {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("\n🎉 All tests passed! Your AI integration is working correctly.")
        print("\n📋 Next steps:")
        print("1. Open http://localhost:3000/dashboard")
        print("2. Navigate to the 'AI Analytics' tab")
        print("3. Enable auto-optimization and alerts")
        print("4. Monitor real-time data and AI recommendations")
    else:
        print(f"\n⚠️  {len(tests) - passed} test(s) failed. Please check the issues above.")
        print("\n🔧 Troubleshooting tips:")
        if not results[0][1]:  # AI Agent health failed
            print("- Make sure AI agent is running: python start.py")
            print("- Check if port 8000 is available")
        if not results[4][1]:  # Frontend API failed
            print("- Make sure frontend is running: npm run dev")
            print("- Check if port 3000 is available")
    
    return passed == len(tests)

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)
