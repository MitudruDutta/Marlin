"""
Algorand Integration Module

This module provides the AlgorandClient and ContractManager classes for interacting
with the Marlin smart contracts on the Algorand blockchain.
"""

import os
import sys
from typing import Optional, Dict, Any, List
from pathlib import Path

# Add the marlin-contracts path to sys.path to import generated clients
contracts_path = Path(__file__).parent.parent / "marlin-contracts" / "smart_contracts"
if str(contracts_path) not in sys.path:
    sys.path.append(str(contracts_path))

try:
    from algokit_utils import AlgorandClient as AlgoKitAlgorandClient
    from algokit_utils.config import config
    from algosdk.v2client import algod
    from algosdk import account, mnemonic
    from algosdk.transaction import PaymentTxn, ApplicationCallTxn
    
    # Import generated contract clients
    from artifacts.yield_tokenization.yield_tokenization_client import YieldTokenizationClient
    from artifacts.pt_token.pt_token_client import PtTokenClient
    from artifacts.yt_token.yt_token_client import YtTokenClient
    from artifacts.simple_amm.simple_amm_client import SimpleAmmClient
    from artifacts.staking_dapp.staking_dapp_client import StakingDappClient
    from artifacts.price_oracle.price_oracle_client import PriceOracleClient
    from artifacts.standardized_wrapper.standardized_wrapper_client import StandardizedWrapperClient
    from artifacts.yt_auto_converter.yt_auto_converter_client import YtAutoConverterClient
    
    ALGOKIT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: AlgoKit dependencies not available: {e}")
    ALGOKIT_AVAILABLE = False


class AlgorandClient:
    """Client for connecting to Algorand network"""
    
    def __init__(self, network: str = "testnet", algod_address: str = None, algod_token: str = ""):
        if not ALGOKIT_AVAILABLE:
            raise RuntimeError("AlgoKit dependencies not installed. Run: pip install algokit-utils")
        
        self.network = network
        self.algod_address = algod_address or self._get_default_address(network)
        self.algod_token = algod_token
        
        # Initialize Algod client
        self.algod_client = algod.AlgodClient(self.algod_token, self.algod_address)
        
        # Initialize AlgoKit client
        if network == "localnet":
            self.algorand = AlgoKitAlgorandClient.localnet()
        elif network == "testnet":
            self.algorand = AlgoKitAlgorandClient.testnet()
        else:  # mainnet
            self.algorand = AlgoKitAlgorandClient.mainnet()
        
        # Test connection
        try:
            status = self.algod_client.status()
            print(f"Connected to Algorand {network} - Round: {status['last-round']}")
        except Exception as e:
            print(f"Warning: Could not verify Algorand connection: {e}")
    
    def _get_default_address(self, network: str) -> str:
        """Get default Algod address for network"""
        if network == "testnet":
            return "https://testnet-api.algonode.cloud"
        elif network == "mainnet":
            return "https://mainnet-api.algonode.cloud"
        else:  # localnet
            return "http://localhost:4001"
    
    def get_account_info(self, address: str) -> Dict[str, Any]:
        """Get account information"""
        try:
            return self.algod_client.account_info(address)
        except Exception as e:
            raise RuntimeError(f"Failed to get account info for {address}: {e}")
    
    def get_application_info(self, app_id: int) -> Dict[str, Any]:
        """Get application information"""
        try:
            return self.algod_client.application_info(app_id)
        except Exception as e:
            raise RuntimeError(f"Failed to get app info for {app_id}: {e}")


class ContractManager:
    """Manager for interacting with deployed Marlin smart contracts"""
    
    def __init__(self, algorand_client: AlgorandClient):
        self.algorand_client = algorand_client
        self.contracts: Dict[str, Any] = {}
        self.app_ids: Dict[str, int] = {}
        
        # Load contract app IDs from environment or config
        self._load_contract_app_ids()
    
    def _load_contract_app_ids(self):
        """Load contract application IDs from environment variables"""
        contract_names = [
            "YIELD_TOKENIZATION",
            "PT_TOKEN", 
            "YT_TOKEN",
            "SIMPLE_AMM",
            "STAKING_DAPP",
            "PRICE_ORACLE",
            "STANDARDIZED_WRAPPER",
            "YT_AUTO_CONVERTER"
        ]
        
        for contract_name in contract_names:
            app_id_env = f"{contract_name}_APP_ID"
            app_id = os.getenv(app_id_env)
            if app_id:
                try:
                    self.app_ids[contract_name.lower()] = int(app_id)
                    print(f"Loaded {contract_name} app ID: {app_id}")
                except ValueError:
                    print(f"Warning: Invalid app ID for {contract_name}: {app_id}")
            else:
                print(f"Warning: No app ID found for {contract_name} (set {app_id_env})")
    
    def get_contract_client(self, contract_name: str):
        """Get contract client instance"""
        if contract_name in self.contracts:
            return self.contracts[contract_name]
        
        app_id = self.app_ids.get(contract_name.lower())
        if not app_id:
            raise ValueError(f"No app ID configured for contract: {contract_name}")
        
        # Create appropriate client based on contract name
        client_map = {
            "yield_tokenization": YieldTokenizationClient,
            "pt_token": PtTokenClient,
            "yt_token": YtTokenClient,
            "simple_amm": SimpleAmmClient,
            "staking_dapp": StakingDappClient,
            "price_oracle": PriceOracleClient,
            "standardized_wrapper": StandardizedWrapperClient,
            "yt_auto_converter": YtAutoConverterClient,
        }
        
        client_class = client_map.get(contract_name.lower())
        if not client_class:
            raise ValueError(f"Unknown contract: {contract_name}")
        
        try:
            client = client_class(
                algorand=self.algorand_client.algorand,
                app_id=app_id
            )
            self.contracts[contract_name] = client
            return client
        except Exception as e:
            raise RuntimeError(f"Failed to create client for {contract_name}: {e}")
    
    async def get_investment_recommendations(
        self,
        amount_algo: float,
        pt_ratio: float,
        yt_ratio: float,
        maturity_months: int
    ) -> Dict[str, Any]:
        """Get investment recommendations based on AI analysis"""
        try:
            # Get current market data from contracts
            price_oracle = self.get_contract_client("price_oracle")
            yield_tokenization = self.get_contract_client("yield_tokenization")
            
            # Calculate recommended amounts
            pt_amount = amount_algo * pt_ratio
            yt_amount = amount_algo * yt_ratio
            
            # Get contract states and calculate expected returns
            recommendations = {
                "total_amount_algo": amount_algo,
                "pt_allocation": {
                    "amount_algo": pt_amount,
                    "ratio": pt_ratio,
                    "contract": "pt_token",
                    "expected_return_pct": self._calculate_pt_return(maturity_months)
                },
                "yt_allocation": {
                    "amount_algo": yt_amount,
                    "ratio": yt_ratio,
                    "contract": "yt_token", 
                    "expected_return_pct": self._calculate_yt_return(maturity_months)
                },
                "maturity_months": maturity_months,
                "risk_metrics": {
                    "volatility_estimate": 0.15,  # Placeholder
                    "liquidity_score": 0.8,       # Placeholder
                    "smart_contract_risk": "medium"
                },
                "next_steps": [
                    f"Deposit {pt_amount:.2f} ALGO to PT token contract",
                    f"Deposit {yt_amount:.2f} ALGO to YT token contract",
                    f"Monitor positions until maturity ({maturity_months} months)"
                ]
            }
            
            return recommendations
            
        except Exception as e:
            raise RuntimeError(f"Failed to get investment recommendations: {e}")
    
    def _calculate_pt_return(self, maturity_months: int) -> float:
        """Calculate expected PT return (placeholder)"""
        # This would normally query the actual contract state
        base_rate = 0.05  # 5% base rate
        time_factor = maturity_months / 12.0
        return base_rate * time_factor * 100  # Return as percentage
    
    def _calculate_yt_return(self, maturity_months: int) -> float:
        """Calculate expected YT return (placeholder)"""
        # This would normally query the actual contract state and market conditions
        base_rate = 0.08  # 8% base rate (higher risk)
        volatility_premium = 0.03
        time_factor = maturity_months / 12.0
        return (base_rate + volatility_premium) * time_factor * 100
    
    async def execute_action(
        self,
        action: str,
        amount: Optional[float] = None,
        maturity_timestamp: Optional[int] = None,
        user_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a contract action"""
        if not user_address:
            raise ValueError("User address is required for contract interactions")
        
        try:
            if action == "deposit_pt":
                return await self._deposit_pt(amount, user_address)
            elif action == "deposit_yt":
                return await self._deposit_yt(amount, user_address)
            elif action == "withdraw_pt":
                return await self._withdraw_pt(amount, user_address)
            elif action == "withdraw_yt":
                return await self._withdraw_yt(amount, user_address)
            elif action == "swap":
                return await self._execute_swap(amount, user_address)
            else:
                raise ValueError(f"Unknown action: {action}")
                
        except Exception as e:
            raise RuntimeError(f"Failed to execute action {action}: {e}")
    
    async def _deposit_pt(self, amount: float, user_address: str) -> Dict[str, Any]:
        """Deposit to PT token contract"""
        # This is a placeholder - actual implementation would create and send transactions
        return {
            "action": "deposit_pt",
            "amount": amount,
            "user_address": user_address,
            "status": "simulated",
            "message": "PT deposit transaction would be created here"
        }
    
    async def _deposit_yt(self, amount: float, user_address: str) -> Dict[str, Any]:
        """Deposit to YT token contract"""
        return {
            "action": "deposit_yt", 
            "amount": amount,
            "user_address": user_address,
            "status": "simulated",
            "message": "YT deposit transaction would be created here"
        }
    
    async def _withdraw_pt(self, amount: float, user_address: str) -> Dict[str, Any]:
        """Withdraw from PT token contract"""
        return {
            "action": "withdraw_pt",
            "amount": amount,
            "user_address": user_address,
            "status": "simulated", 
            "message": "PT withdrawal transaction would be created here"
        }
    
    async def _withdraw_yt(self, amount: float, user_address: str) -> Dict[str, Any]:
        """Withdraw from YT token contract"""
        return {
            "action": "withdraw_yt",
            "amount": amount,
            "user_address": user_address,
            "status": "simulated",
            "message": "YT withdrawal transaction would be created here"
        }
    
    async def _execute_swap(self, amount: float, user_address: str) -> Dict[str, Any]:
        """Execute token swap via AMM"""
        return {
            "action": "swap",
            "amount": amount,
            "user_address": user_address,
            "status": "simulated",
            "message": "Swap transaction would be created here"
        }
    
    async def get_contract_status(self) -> Dict[str, Any]:
        """Get status of all deployed contracts"""
        status = {
            "network": self.algorand_client.network,
            "contracts": {},
            "total_contracts": len(self.app_ids),
            "connected_contracts": 0
        }
        
        for contract_name, app_id in self.app_ids.items():
            try:
                app_info = self.algorand_client.get_application_info(app_id)
                status["contracts"][contract_name] = {
                    "app_id": app_id,
                    "status": "active",
                    "global_state_size": len(app_info.get("params", {}).get("global-state", [])),
                    "creator": app_info.get("params", {}).get("creator")
                }
                status["connected_contracts"] += 1
            except Exception as e:
                status["contracts"][contract_name] = {
                    "app_id": app_id,
                    "status": "error",
                    "error": str(e)
                }
        
        return status
