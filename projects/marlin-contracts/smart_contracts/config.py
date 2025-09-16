"""
Configuration settings for Marlin Algorand smart contracts

This module contains all configuration settings for the smart contracts,
including network settings, contract parameters, and deployment configurations.
"""

import os
from dataclasses import dataclass
from typing import Dict, Any
from pathlib import Path


@dataclass
class NetworkConfig:
    """Network configuration for different Algorand networks"""
    name: str
    algod_address: str
    algod_token: str
    indexer_address: str
    indexer_token: str
    explorer_url: str
    faucet_url: str


@dataclass
class ContractConfig:
    """Configuration for individual smart contracts"""
    name: str
    file_path: str
    global_schema: Dict[str, int]
    local_schema: Dict[str, int]
    extra_pages: int = 0


class MarlinConfig:
    """Main configuration class for Marlin contracts"""
    
    # Network configurations
    NETWORKS = {
        'testnet': NetworkConfig(
            name='testnet',
            algod_address='https://testnet-api.algonode.cloud/',
            algod_token='',
            indexer_address='https://testnet-idx.algonode.cloud/',
            indexer_token='',
            explorer_url='https://testnet.algoexplorer.io',
            faucet_url='https://testnet.algoexplorer.io/dispenser'
        )
        # 'mainnet': NetworkConfig(
        #     name='mainnet',
        #     algod_address='https://mainnet-api.algonode.cloud',
        #     algod_token='',
        #     indexer_address='https://mainnet-idx.algonode.cloud',
        #     indexer_token='',
        #     explorer_url='https://algoexplorer.io',
        #     faucet_url=''
        # ),
        # 'localnet': NetworkConfig(
        #     name='localnet',
        #     algod_address='http://localhost:4001',
        #     algod_token='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        #     indexer_address='http://localhost:8980',
        #     indexer_token='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        #     explorer_url='http://localhost:8080',
        #     faucet_url=''
        # )
    }
    
    # Contract configurations
    CONTRACTS = {
        'price_oracle': ContractConfig(
            name='PriceOracle',
            file_path='oracles/price_oracle.py',
            global_schema={'num_uints': 20, 'num_byte_slices': 10},
            local_schema={'num_uints': 5, 'num_byte_slices': 2}
        ),
        'standardized_wrapper': ContractConfig(
            name='StandardizedWrapper',
            file_path='tokens/standardized_wrapper.py',
            global_schema={'num_uints': 15, 'num_byte_slices': 5},
            local_schema={'num_uints': 10, 'num_byte_slices': 2}
        ),
        'pt_token': ContractConfig(
            name='PTToken',
            file_path='tokens/pt_token.py',
            global_schema={'num_uints': 10, 'num_byte_slices': 5},
            local_schema={'num_uints': 5, 'num_byte_slices': 2}
        ),
        'yt_token': ContractConfig(
            name='YTToken',
            file_path='tokens/yt_token.py',
            global_schema={'num_uints': 10, 'num_byte_slices': 5},
            local_schema={'num_uints': 5, 'num_byte_slices': 2}
        ),
        'yield_tokenization': ContractConfig(
            name='YieldTokenization',
            file_path='core/yield_tokenization.py',
            global_schema={'num_uints': 15, 'num_byte_slices': 10},
            local_schema={'num_uints': 10, 'num_byte_slices': 2}
        ),
        'simple_amm': ContractConfig(
            name='SimpleAMM',
            file_path='infrastructure/simple_amm.py',
            global_schema={'num_uints': 15, 'num_byte_slices': 5},
            local_schema={'num_uints': 10, 'num_byte_slices': 2}
        ),
        'staking_dapp': ContractConfig(
            name='StakingDapp',
            file_path='infrastructure/staking_dapp.py',
            global_schema={'num_uints': 15, 'num_byte_slices': 5},
            local_schema={'num_uints': 10, 'num_byte_slices': 2}
        ),
        'yt_auto_converter': ContractConfig(
            name='YTAutoConverter',
            file_path='advanced/yt_auto_converter.py',
            global_schema={'num_uints': 20, 'num_byte_slices': 10},
            local_schema={'num_uints': 15, 'num_byte_slices': 2}
        )
    }
    
    # Protocol parameters
    PROTOCOL_PARAMS = {
        'default_yield_rate': 500,  # 5% in basis points
        'default_fee_rate': 30,     # 0.3% in basis points
        'min_update_interval': 300,  # 5 minutes in seconds
        'staleness_threshold': 3600, # 1 hour in seconds
        'max_price_deviation': 1000, # 10% in basis points
        'reward_amount': 5,          # Staking reward amount
        'reward_interval': 10,       # Staking reward interval in seconds
        'precision_factor': 1000000000,  # 10^9 for calculations
    }
    
    # Deployment settings
    DEPLOYMENT_SETTINGS = {
        'min_balance_algo': 1.0,     # Minimum ALGO balance for deployment
        'transaction_timeout': 30,    # Transaction timeout in seconds
        'confirmation_rounds': 4,     # Rounds to wait for confirmation
        'max_retries': 3,            # Maximum deployment retries
    }
    
    # AI/ML Configuration
    AI_CONFIG = {
        'lstm_model_path': 'models/lstm_model.pkl',
        'prediction_window': 30,      # Days for LSTM prediction
        'confidence_threshold': 0.8,  # Minimum confidence for AI recommendations
        'retraining_interval': 86400, # 24 hours in seconds
    }
    
    @classmethod
    def get_network_config(cls, network_name: str = None) -> NetworkConfig:
        """Get network configuration"""
        if network_name is None:
            network_name = os.getenv('NETWORK', 'testnet')
        
        if network_name not in cls.NETWORKS:
            raise ValueError(f"Unknown network: {network_name}")
        
        return cls.NETWORKS[network_name]
    
    @classmethod
    def get_contract_config(cls, contract_name: str) -> ContractConfig:
        """Get contract configuration"""
        if contract_name not in cls.CONTRACTS:
            raise ValueError(f"Unknown contract: {contract_name}")
        
        return cls.CONTRACTS[contract_name]
    
    @classmethod
    def get_all_contracts(cls) -> Dict[str, ContractConfig]:
        """Get all contract configurations"""
        return cls.CONTRACTS.copy()
    
    @classmethod
    def get_deployment_order(cls) -> list:
        """Get the correct order for contract deployment"""
        return [
            'price_oracle',
            'standardized_wrapper',
            'pt_token',
            'yt_token',
            'yield_tokenization',
            'simple_amm',
            'staking_dapp',
            'yt_auto_converter'
        ]
    
    @classmethod
    def get_protocol_param(cls, param_name: str, default: Any = None) -> Any:
        """Get protocol parameter"""
        return cls.PROTOCOL_PARAMS.get(param_name, default)
    
    @classmethod
    def get_deployment_setting(cls, setting_name: str, default: Any = None) -> Any:
        """Get deployment setting"""
        return cls.DEPLOYMENT_SETTINGS.get(setting_name, default)
    
    @classmethod
    def validate_environment(cls) -> bool:
        """Validate environment configuration"""
        required_vars = ['NETWORK']
        optional_vars = ['DEPLOYER_MNEMONIC', 'ALGOD_ADDRESS', 'ALGOD_TOKEN']
        
        # Check required variables
        for var in required_vars:
            if not os.getenv(var):
                print(f"Warning: Required environment variable {var} not set")
                return False
        
        # Check network validity
        network = os.getenv('NETWORK')
        if network not in cls.NETWORKS:
            print(f"Error: Invalid network '{network}'. Valid options: {list(cls.NETWORKS.keys())}")
            return False
        
        return True
    
    @classmethod
    def load_from_env(cls) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        config = {}
        
        # Network configuration
        config['network'] = os.getenv('NETWORK', 'testnet')
        config['algod_address'] = os.getenv('ALGOD_ADDRESS')
        config['algod_token'] = os.getenv('ALGOD_TOKEN', '')
        
        # Deployment configuration
        config['deployer_mnemonic'] = os.getenv('DEPLOYER_MNEMONIC')
        config['debug'] = os.getenv('DEBUG', 'false').lower() == 'true'
        
        # AI configuration
        config['gemini_api_key'] = os.getenv('GEMINI_API_KEY')
        config['lstm_model_path'] = os.getenv('LSTM_MODEL_PATH', cls.AI_CONFIG['lstm_model_path'])
        
        return config
    
    @classmethod
    def create_env_template(cls, file_path: str = '.env') -> None:
        """Create environment file template"""
        template = f"""# Marlin Algorand Environment Configuration

# Network Configuration
NETWORK=testnet

# Algorand Node Configuration (leave empty to use defaults)
ALGOD_ADDRESS=
ALGOD_TOKEN=

# Deployer Account (leave empty to generate new account)
DEPLOYER_MNEMONIC=

# Development Settings
DEBUG=true

# AI/ML Configuration
GEMINI_API_KEY=
LSTM_MODEL_PATH=models/

# Protocol Parameters (optional overrides)
DEFAULT_YIELD_RATE={cls.PROTOCOL_PARAMS['default_yield_rate']}
DEFAULT_FEE_RATE={cls.PROTOCOL_PARAMS['default_fee_rate']}

# Deployment Settings
MIN_BALANCE_ALGO={cls.DEPLOYMENT_SETTINGS['min_balance_algo']}
TRANSACTION_TIMEOUT={cls.DEPLOYMENT_SETTINGS['transaction_timeout']}
"""
        
        with open(file_path, 'w') as f:
            f.write(template)
        
        print(f"Environment template created: {file_path}")


# Global configuration instance
config = MarlinConfig()

# Export commonly used configurations
NETWORKS = MarlinConfig.NETWORKS
CONTRACTS = MarlinConfig.CONTRACTS
PROTOCOL_PARAMS = MarlinConfig.PROTOCOL_PARAMS
DEPLOYMENT_SETTINGS = MarlinConfig.DEPLOYMENT_SETTINGS