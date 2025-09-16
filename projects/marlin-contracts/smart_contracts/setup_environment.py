"""
Environment setup script for Tesserapt Algorand development

This script helps set up the development environment for Algorand smart contracts.
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False


def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True


def setup_virtual_environment():
    """Set up Python virtual environment"""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    print("🔧 Creating virtual environment...")
    if run_command("python -m venv venv", "Virtual environment creation"):
        print("✅ Virtual environment created")
        return True
    return False


def install_dependencies():
    """Install required dependencies"""
    activate_cmd = "venv\\Scripts\\activate" if os.name == 'nt' else "source venv/bin/activate"
    pip_cmd = "venv\\Scripts\\pip" if os.name == 'nt' else "venv/bin/pip"
    
    commands = [
        (f"{pip_cmd} install --upgrade pip", "Upgrading pip"),
        (f"{pip_cmd} install -r requirements.txt", "Installing dependencies"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            return False
    
    return True


def check_algokit_installation():
    """Check if AlgoKit is properly installed"""
    try:
        result = subprocess.run("algokit --version", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ AlgoKit installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ AlgoKit not found")
            return False
    except Exception as e:
        print(f"❌ Error checking AlgoKit: {e}")
        return False


def install_algokit():
    """Install AlgoKit if not present"""
    if check_algokit_installation():
        return True
    
    print("🔧 Installing AlgoKit...")
    pip_cmd = "venv\\Scripts\\pip" if os.name == 'nt' else "venv/bin/pip"
    
    if run_command(f"{pip_cmd} install algokit", "AlgoKit installation"):
        return check_algokit_installation()
    return False


def create_env_file():
    """Create .env file template"""
    env_file = Path(".env")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    env_template = """# Tesserapt Algorand Environment Configuration

# Deployer Account (leave empty to generate new account)
DEPLOYER_MNEMONIC=

# Algorand Node Configuration
ALGOD_ADDRESS=https://testnet-api.algonode.cloud
ALGOD_TOKEN=

# Optional: Custom node configuration
# ALGOD_ADDRESS=http://localhost:4001
# ALGOD_TOKEN=your_token_here

# Development Settings
NETWORK=testnet
DEBUG=true

# AI/ML Configuration (for future integration)
GEMINI_API_KEY=
LSTM_MODEL_PATH=models/
"""
    
    with open(env_file, 'w') as f:
        f.write(env_template)
    
    print("✅ .env file template created")
    print("📝 Please edit .env file with your configuration")
    return True


def create_project_structure():
    """Create additional project structure"""
    directories = [
        "tests",
        "scripts",
        "models",
        "docs",
        "deployment_data"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True)
            print(f"📁 Created directory: {directory}")
    
    return True


def create_test_files():
    """Create basic test files"""
    test_file = Path("tests/test_contracts.py")
    
    if test_file.exists():
        return True
    
    test_template = '''"""
Basic tests for Tesserapt smart contracts
"""

import pytest
from algosdk import account
from algosdk.v2client import algod


class TestTesseraptContracts:
    """Test suite for Tesserapt contracts"""
    
    def setup_method(self):
        """Setup test environment"""
        self.algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")
        self.test_account_sk, self.test_account_addr = account.generate_account()
    
    def test_account_generation(self):
        """Test account generation"""
        assert self.test_account_addr is not None
        assert len(self.test_account_addr) == 58  # Algorand address length
    
    def test_algod_connection(self):
        """Test connection to Algorand node"""
        status = self.algod_client.status()
        assert "last-round" in status
    
    # Add more specific contract tests here
    def test_yield_tokenization_deployment(self):
        """Test yield tokenization contract deployment"""
        # TODO: Implement contract deployment test
        pass
    
    def test_pt_token_functionality(self):
        """Test PT token functionality"""
        # TODO: Implement PT token tests
        pass
    
    def test_yt_token_functionality(self):
        """Test YT token functionality"""
        # TODO: Implement YT token tests
        pass
    
    def test_amm_functionality(self):
        """Test AMM functionality"""
        # TODO: Implement AMM tests
        pass
'''
    
    with open(test_file, 'w') as f:
        f.write(test_template)
    
    print("✅ Test file template created")
    return True


def main():
    """Main setup function"""
    print("🎯 Tesserapt Algorand Development Environment Setup")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Setup virtual environment
    if not setup_virtual_environment():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Install AlgoKit
    if not install_algokit():
        return False
    
    # Create environment file
    if not create_env_file():
        return False
    
    # Create project structure
    if not create_project_structure():
        return False
    
    # Create test files
    if not create_test_files():
        return False
    
    print("\n🎉 Environment setup completed successfully!")
    print("=" * 60)
    print("📋 Next steps:")
    print("1. Edit .env file with your configuration")
    print("2. Activate virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("3. Run tests: pytest tests/")
    print("4. Deploy contracts: python deploy_contracts.py")
    print("\n🔗 Useful links:")
    print("- Algorand Developer Portal: https://developer.algorand.org/")
    print("- AlgoKit Documentation: https://github.com/algorandfoundation/algokit-cli")
    print("- Testnet Dispenser: https://testnet.algoexplorer.io/dispenser")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)