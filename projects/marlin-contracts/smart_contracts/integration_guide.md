# Tesserapt Algorand Integration Guide

This guide explains how to integrate the Tesserapt Algorand smart contracts with your frontend application.

## Quick Start

### 1. Environment Setup

```bash
# Navigate to contracts directory
cd staking-application/src/contracts/algorand_contracts

# Setup development environment
python setup_environment.py

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Deploy Contracts

```bash
# Deploy all contracts to testnet
python deploy_contracts.py
```

This will create:
- `deployment_info.json` - Complete deployment information
- `contract_addresses.ts` - TypeScript file for frontend integration

### 3. Frontend Integration

Copy the generated `contract_addresses.ts` to your frontend project:

```typescript
import { TESSERAPT_CONTRACTS } from './contract_addresses';

// Access contract app IDs
const yieldTokenizationAppId = TESSERAPT_CONTRACTS.contracts.yieldtokenization;
const ammAppId = TESSERAPT_CONTRACTS.contracts.simpleamm;
```

## Contract Architecture

### Core Contracts

1. **YieldTokenization** (`core/yield_tokenization.py`)
   - Splits SY tokens into PT + YT tokens
   - Manages maturity dates
   - Handles redemption at maturity

2. **PTToken** (`tokens/pt_token.py`)
   - Principal Token implementation
   - Represents redemption rights at maturity

3. **YTToken** (`tokens/yt_token.py`)
   - Yield Token implementation
   - Captures future yield until maturity

4. **StandardizedWrapper** (`tokens/standardized_wrapper.py`)
   - Wraps multiple yield-bearing tokens into SY tokens
   - Entry point for users

### Infrastructure Contracts

5. **SimpleAMM** (`infrastructure/simple_amm.py`)
   - Automated Market Maker for PT/YT trading
   - Constant product formula (x * y = k)

6. **StakingDapp** (`infrastructure/staking_dapp.py`)
   - Time-based staking rewards
   - Provides underlying yield

### Advanced Contracts

7. **PriceOracle** (`oracles/price_oracle.py`)
   - Reliable price feeds with validation
   - Threshold monitoring for automation

8. **YTAutoConverter** (`advanced/yt_auto_converter.py`)
   - AI-powered YT to PT conversion
   - Automated execution based on thresholds

## Usage Examples

### Basic User Flow

```python
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.atomic_transaction_composer import AtomicTransactionComposer

# Setup
algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")
user_sk = mnemonic.to_private_key("your mnemonic here")
user_addr = account.address_from_private_key(user_sk)

# 1. Wrap tokens into SY tokens
wrapper_app_id = TESSERAPT_CONTRACTS.contracts.standardizedwrapper
# Call wrap_tokens method

# 2. Split SY tokens into PT/YT
tokenization_app_id = TESSERAPT_CONTRACTS.contracts.yieldtokenization
# Call split_tokens method

# 3. Trade on AMM
amm_app_id = TESSERAPT_CONTRACTS.contracts.simpleamm
# Call swap methods

# 4. Setup AI automation
converter_app_id = TESSERAPT_CONTRACTS.contracts.ytautoconverter
# Call configure_conversion method
```

### Frontend Integration with React

```typescript
import { useWallet } from '@txnlab/use-wallet';
import { TESSERAPT_CONTRACTS } from './contract_addresses';

export function TesseraptDashboard() {
  const { activeAddress, signTransactions } = useWallet();
  
  const splitTokens = async (amount: number, maturity: number) => {
    // Create application call transaction
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: activeAddress,
      appIndex: TESSERAPT_CONTRACTS.contracts.yieldtokenization,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('split_tokens')),
        algosdk.encodeUint64(amount),
        algosdk.encodeUint64(maturity)
      ],
      // ... other parameters
    });
    
    // Sign and send transaction
    const signedTxns = await signTransactions([appCallTxn]);
    // Submit to network
  };
  
  return (
    <div>
      <h1>Tesserapt AI Investment Platform</h1>
      {/* Your UI components */}
    </div>
  );
}
```

## Contract Methods

### YieldTokenization Contract

```python
# Initialize protocol
initialize(base_name: String, base_symbol: String) -> String

# Create new maturity
create_maturity(maturity_timestamp: UInt64) -> String

# Split SY tokens into PT/YT
split_tokens(amount: UInt64, maturity: UInt64) -> String

# Redeem PT tokens at maturity
redeem_tokens(amount: UInt64, maturity: UInt64) -> String

# Get user balances
get_user_balances() -> (UInt64, UInt64, UInt64)  # SY, PT, YT

# Pause/unpause protocol
pause_protocol() -> String
unpause_protocol() -> String
```

### SimpleAMM Contract

```python
# Add liquidity
add_liquidity(amount_a: UInt64, amount_b: UInt64) -> String

# Swap tokens
swap_a_for_b(amount_in: UInt64) -> String
swap_b_for_a(amount_in: UInt64) -> String

# Get reserves
get_reserves() -> (UInt64, UInt64)

# Calculate output amount
get_amount_out(amount_in: UInt64, reserve_in: UInt64, reserve_out: UInt64) -> UInt64
```

### YTAutoConverter Contract

```python
# Configure conversion
configure_conversion(enabled: UInt64, threshold_price: UInt64, maturity: UInt64) -> String

# Execute conversion
execute_conversion(user: Bytes, min_pt_amount: UInt64, deadline: UInt64) -> String

# Check if conversion can be executed
can_execute_conversion(user: Bytes) -> UInt64

# Get AI recommendation
get_ai_recommendation(yt_amount: UInt64, current_price: UInt64) -> (UInt64, String)
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_contracts.py -v

# Run with coverage
pytest tests/ --cov=contracts
```

## Security Considerations

1. **Access Control**: All admin functions are protected by sender verification
2. **Input Validation**: All inputs are validated for bounds and correctness
3. **Reentrancy Protection**: State updates happen before external calls
4. **Pause Mechanisms**: Emergency pause functionality in all contracts
5. **Circuit Breakers**: Price oracle has circuit breaker for extreme conditions

## Deployment Networks

### Testnet
- **Network**: Algorand Testnet
- **Node**: https://testnet-api.algonode.cloud
- **Explorer**: https://testnet.algoexplorer.io/
- **Faucet**: https://testnet.algoexplorer.io/dispenser

### Mainnet (Future)
- **Network**: Algorand Mainnet
- **Node**: https://mainnet-api.algonode.cloud
- **Explorer**: https://algoexplorer.io/

## Monitoring and Analytics

After deployment, monitor your contracts:

1. **Transaction Volume**: Track usage via AlgoExplorer
2. **Contract State**: Monitor global and local state changes
3. **Error Rates**: Watch for failed transactions
4. **Gas Usage**: Optimize for cost efficiency

## Support and Resources

- **Algorand Developer Portal**: https://developer.algorand.org/
- **AlgoKit Documentation**: https://github.com/algorandfoundation/algokit-cli
- **Algorand Python SDK**: https://py-algorand-sdk.readthedocs.io/
- **Community Discord**: https://discord.gg/algorand

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure deployer account has enough ALGOs
2. **Schema Limits**: Adjust global/local schema if state requirements change
3. **Transaction Fees**: Account for minimum transaction fees
4. **App Call Limits**: Be aware of app call depth and complexity limits

### Debug Mode

Enable debug logging in your `.env` file:

```bash
DEBUG=true
NETWORK=testnet
```

This will provide detailed transaction information and error messages.

## Next Steps

1. **Frontend Integration**: Use the generated contract addresses in your React app
2. **AI Integration**: Connect LSTM models for price prediction
3. **Real-time Data**: Integrate with DeFiLlama API for live market data
4. **Mobile App**: Consider mobile integration with WalletConnect
5. **Mainnet Deployment**: Deploy to mainnet when ready for production

Happy building with Tesserapt! 🚀