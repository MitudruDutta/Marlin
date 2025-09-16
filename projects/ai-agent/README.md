# Marlin AI Agent Backend

AI-powered investment recommendations for Algorand DeFi using the Marlin protocol smart contracts.

## Features

- **AI-Powered Recommendations**: Uses LSTM models and Gemini AI for investment analysis
- **DeFiLlama Integration**: Real-time yield farming data and price feeds
- **Algorand Smart Contracts**: Direct integration with Marlin protocol contracts
- **Risk Assessment**: Multi-criteria decision analysis (TOPSIS) for pool ranking
- **RESTful API**: FastAPI-based backend with comprehensive endpoints

## Quick Start

### 1. Install Dependencies

```bash
cd projects/ai-agent
pip install -r requirements.txt
```

### 2. Set up Environment Variables

Copy the example environment file and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```bash
# Required: Gemini AI API key for narratives
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Smart contract app IDs (if contracts are deployed)
YIELD_TOKENIZATION_APP_ID=123456789
PT_TOKEN_APP_ID=123456790
# ... etc
```

### 3. Run the API Server

```bash
# Development mode
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /health` - Server and component status

### Price Data
- `GET /coins/{coin_id}` - Current coin data with price changes
- `GET /coins/{coin_id}/history?days=120` - Historical price data

### AI Recommendations
- `POST /optimize` - Get AI-powered investment recommendations
- `GET /defi/recommend` - DeFiLlama yield farming recommendations

### DeFi Pools
- `GET /defi/pools` - List available pools with filters
- `GET /defi/lp` - Get specific liquidity pool details

### Smart Contracts (when deployed)
- `POST /contracts/interact` - Execute contract actions
- `GET /contracts/status` - Get contract deployment status

## Configuration

### Environment Variables

#### Required for Basic Operation
- `GEMINI_API_KEY` - Google Gemini AI API key for generating narratives

#### Algorand Configuration
- `NETWORK` - `testnet`, `mainnet`, or `localnet` (default: `testnet`)
- `ALGOD_ADDRESS` - Algorand node endpoint
- `ALGOD_TOKEN` - Algorand node token (usually empty for public nodes)

#### Smart Contract App IDs (after deployment)
- `YIELD_TOKENIZATION_APP_ID`
- `PT_TOKEN_APP_ID`
- `YT_TOKEN_APP_ID`
- `SIMPLE_AMM_APP_ID`
- `STAKING_DAPP_APP_ID`
- `PRICE_ORACLE_APP_ID`
- `STANDARDIZED_WRAPPER_APP_ID`
- `YT_AUTO_CONVERTER_APP_ID`

#### ML Model Settings
- `MODEL_WINDOW` - LSTM lookback window (default: 30)
- `MODEL_DEFAULT_DAYS` - Historical data days (default: 120)
- `SKIP_MODEL_TRAIN` - Skip model training on startup (default: false)

## Smart Contract Integration

The AI agent integrates with the following Marlin protocol contracts:

1. **Yield Tokenization** - Core protocol for splitting yield-bearing assets
2. **PT/YT Tokens** - Principal and Yield Token implementations
3. **Simple AMM** - Automated market maker for token swaps
4. **Price Oracle** - Price feed aggregation
5. **Staking DApp** - Staking and rewards distribution
6. **Standardized Wrapper** - Asset wrapping interface
7. **YT Auto Converter** - Automatic yield token conversion

### Contract Deployment

Before using contract features, deploy the smart contracts:

```bash
cd ../marlin-contracts
# Follow the deployment instructions in that project
```

After deployment, update your `.env` file with the contract app IDs.

## API Usage Examples

### Get Investment Recommendations

```bash
curl -X POST "http://localhost:8000/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "coin_id": "algorand",
    "risk_profile": "moderate",
    "maturity_months": 6,
    "amount_algo": 1000
  }'
```

### Get DeFi Pool Recommendations

```bash
curl "http://localhost:8000/defi/recommend?amountAlgo=1000&horizonMonths=6&riskTolerance=moderate&topN=3&includeNarrative=true"
```

### Get Pool Information

```bash
curl "http://localhost:8000/defi/lp?query=ALGO&chain=algorand"
```

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
flake8 .
```

## Architecture

The AI agent consists of several key components:

1. **LSTM Model** (`lstm.py`) - Price prediction using gradient boosting
2. **DeFiLlama Integration** (`defillama.py`) - Yield farming data and AI narratives
3. **Algorand Integration** (`algorand_integration.py`) - Smart contract interactions
4. **Main API** (`main.py`) - FastAPI application with all endpoints

## Troubleshooting

### Common Issues

1. **Import errors for AlgoKit**: Install algokit-utils: `pip install algokit-utils`
2. **Missing Gemini API key**: Set `GEMINI_API_KEY` in your `.env` file
3. **Contract interaction errors**: Ensure contracts are deployed and app IDs are set
4. **Price data errors**: Check DeFiLlama API connectivity

### Debug Mode

Set `SKIP_MODEL_TRAIN=true` to skip ML model training during development.

## License

This project is part of the Marlin protocol ecosystem.
