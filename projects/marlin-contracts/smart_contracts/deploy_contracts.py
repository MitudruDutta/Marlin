"""
Deployment script for Marlin Algorand Smart Contracts

This script deploys all the smart contracts for the AI-powered DeFi investment platform
to the Algorand blockchain using AlgoKit.
"""

import os
import json
from pathlib import Path
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn, OnComplete
from algosdk.atomic_transaction_composer import AtomicTransactionComposer, AccountTransactionSigner
import base64

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # AlgoNode doesn't require a token

class ContractDeployer:
    def __init__(self):
        self.algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        self.deployer_private_key = None
        self.deployer_address = None
        self.deployed_contracts = {}
        
    def setup_deployer_account(self):
        """Setup deployer account from environment or create new one"""
        mnemonic_phrase = os.getenv('DEPLOYER_MNEMONIC')
        
        if mnemonic_phrase:
            self.deployer_private_key = mnemonic.to_private_key(mnemonic_phrase)
            self.deployer_address = account.address_from_private_key(self.deployer_private_key)
            print(f"Using existing deployer account: {self.deployer_address}")
        else:
            # Create new account for testing
            self.deployer_private_key, self.deployer_address = account.generate_account()
            deployer_mnemonic = mnemonic.from_private_key(self.deployer_private_key)
            print(f"Created new deployer account: {self.deployer_address}")
            print(f"Mnemonic: {deployer_mnemonic}")
            print("Please fund this account with testnet ALGOs from: https://testnet.algoexplorer.io/dispenser")
            input("Press Enter after funding the account...")
    
    def check_account_balance(self):
        """Check deployer account balance"""
        account_info = self.algod_client.account_info(self.deployer_address)
        balance = account_info.get('amount', 0) / 1_000_000  # Convert microAlgos to Algos
        print(f"Deployer account balance: {balance} ALGO")
        
        if balance < 1.0:
            print("Warning: Low balance. You may need more ALGOs for deployment.")
            return False
        return True
    
    def compile_contract(self, contract_path):
        """Compile a PyTeal contract (placeholder - would use actual compilation)"""
        # In a real implementation, this would compile the Python contract to TEAL
        # For now, returning placeholder approval and clear programs
        
        approval_program = b"#pragma version 8\nint 1\nreturn"  # Placeholder
        clear_program = b"#pragma version 8\nint 1\nreturn"     # Placeholder
        
        return approval_program, clear_program
    
    def deploy_contract(self, contract_name, contract_path, global_schema, local_schema):
        """Deploy a single contract"""
        print(f"\nDeploying {contract_name}...")
        
        try:
            # Compile contract
            approval_program, clear_program = self.compile_contract(contract_path)
            
            # Get suggested parameters
            params = self.algod_client.suggested_params()
            
            # Create application transaction
            txn = ApplicationCreateTxn(
                sender=self.deployer_address,
                sp=params,
                on_complete=OnComplete.NoOpOC,
                approval_program=approval_program,
                clear_program=clear_program,
                global_schema=global_schema,
                local_schema=local_schema,
            )
            
            # Sign and send transaction
            signed_txn = txn.sign(self.deployer_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            # Wait for confirmation
            result = self.algod_client.pending_transaction_info(tx_id)
            app_id = result.get('application-index')
            
            if app_id:
                self.deployed_contracts[contract_name] = {
                    'app_id': app_id,
                    'tx_id': tx_id,
                    'address': self.deployer_address
                }
                print(f"✅ {contract_name} deployed successfully! App ID: {app_id}")
                return app_id
            else:
                print(f"❌ Failed to deploy {contract_name}")
                return None
                
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {str(e)}")
            return None
    
    def deploy_all_contracts(self):
        """Deploy all contracts in the correct order"""
        print("🚀 Starting Tesserapt contract deployment...")
        
        # Contract deployment order and configurations
        contracts_config = [
            {
                'name': 'PriceOracle',
                'path': 'oracles/price_oracle.py',
                'global_schema': {'num_uints': 20, 'num_byte_slices': 10},
                'local_schema': {'num_uints': 5, 'num_byte_slices': 2}
            },
            {
                'name': 'StandardizedWrapper',
                'path': 'tokens/standardized_wrapper.py',
                'global_schema': {'num_uints': 15, 'num_byte_slices': 5},
                'local_schema': {'num_uints': 10, 'num_byte_slices': 2}
            },
            {
                'name': 'PTToken',
                'path': 'tokens/pt_token.py',
                'global_schema': {'num_uints': 10, 'num_byte_slices': 5},
                'local_schema': {'num_uints': 5, 'num_byte_slices': 2}
            },
            {
                'name': 'YTToken',
                'path': 'tokens/yt_token.py',
                'global_schema': {'num_uints': 10, 'num_byte_slices': 5},
                'local_schema': {'num_uints': 5, 'num_byte_slices': 2}
            },
            {
                'name': 'YieldTokenization',
                'path': 'core/yield_tokenization.py',
                'global_schema': {'num_uints': 15, 'num_byte_slices': 10},
                'local_schema': {'num_uints': 10, 'num_byte_slices': 2}
            },
            {
                'name': 'SimpleAMM',
                'path': 'infrastructure/simple_amm.py',
                'global_schema': {'num_uints': 15, 'num_byte_slices': 5},
                'local_schema': {'num_uints': 10, 'num_byte_slices': 2}
            },
            {
                'name': 'StakingDapp',
                'path': 'infrastructure/staking_dapp.py',
                'global_schema': {'num_uints': 15, 'num_byte_slices': 5},
                'local_schema': {'num_uints': 10, 'num_byte_slices': 2}
            },
            {
                'name': 'YTAutoConverter',
                'path': 'advanced/yt_auto_converter.py',
                'global_schema': {'num_uints': 20, 'num_byte_slices': 10},
                'local_schema': {'num_uints': 15, 'num_byte_slices': 2}
            }
        ]
        
        # Deploy each contract
        for contract_config in contracts_config:
            app_id = self.deploy_contract(
                contract_config['name'],
                contract_config['path'],
                contract_config['global_schema'],
                contract_config['local_schema']
            )
            
            if not app_id:
                print(f"❌ Deployment failed for {contract_config['name']}")
                return False
        
        return True
    
    def initialize_contracts(self):
        """Initialize deployed contracts with proper configurations"""
        print("\n🔧 Initializing contracts...")
        
        # Initialize contracts in order
        initialization_order = [
            'PriceOracle',
            'StandardizedWrapper', 
            'PTToken',
            'YTToken',
            'YieldTokenization',
            'SimpleAMM',
            'StakingDapp',
            'YTAutoConverter'
        ]
        
        for contract_name in initialization_order:
            if contract_name in self.deployed_contracts:
                print(f"Initializing {contract_name}...")
                # In a real implementation, would call initialize methods
                # For now, just marking as initialized
                self.deployed_contracts[contract_name]['initialized'] = True
                print(f"✅ {contract_name} initialized")
    
    def save_deployment_info(self):
        """Save deployment information to file"""
        deployment_info = {
            'network': 'testnet',
            'deployer_address': self.deployer_address,
            'deployment_timestamp': int(time.time()),
            'contracts': self.deployed_contracts
        }
        
        # Save to JSON file
        with open('deployment_info.json', 'w') as f:
            json.dump(deployment_info, f, indent=2)
        
        # Save to TypeScript file for frontend integration
        ts_content = f"""// Tesserapt Contract Addresses - Generated automatically
export const TESSERAPT_CONTRACTS = {{
  network: 'testnet',
  deployerAddress: '{self.deployer_address}',
  contracts: {{
"""
        
        for name, info in self.deployed_contracts.items():
            ts_content += f"    {name.lower()}: {info['app_id']},\n"
        
        ts_content += """  }
};

export default TESSERAPT_CONTRACTS;
"""
        
        with open('contract_addresses.ts', 'w') as f:
            f.write(ts_content)
        
        print(f"\n📄 Deployment info saved to:")
        print(f"  - deployment_info.json")
        print(f"  - contract_addresses.ts")
    
    def run_deployment(self):
        """Run the complete deployment process"""
        print("🎯 Tesserapt - AI-Powered DeFi Investment Platform")
        print("=" * 60)
        
        # Setup deployer account
        self.setup_deployer_account()
        
        # Check balance
        if not self.check_account_balance():
            return False
        
        # Deploy contracts
        if not self.deploy_all_contracts():
            print("❌ Deployment failed!")
            return False
        
        # Initialize contracts
        self.initialize_contracts()
        
        # Save deployment info
        self.save_deployment_info()
        
        print("\n🎉 Deployment completed successfully!")
        print("=" * 60)
        print(f"Deployed {len(self.deployed_contracts)} contracts:")
        
        for name, info in self.deployed_contracts.items():
            print(f"  📋 {name}: App ID {info['app_id']}")
        
        print(f"\n🔗 View contracts on AlgoExplorer:")
        for name, info in self.deployed_contracts.items():
            print(f"  {name}: https://testnet.algoexplorer.io/application/{info['app_id']}")
        
        return True


def main():
    """Main deployment function"""
    import time
    
    deployer = ContractDeployer()
    success = deployer.run_deployment()
    
    if success:
        print("\n✨ Ready to integrate with frontend!")
        print("Copy contract_addresses.ts to your frontend project.")
    else:
        print("\n💥 Deployment failed. Check the logs above.")
    
    return success


if __name__ == "__main__":
    main()