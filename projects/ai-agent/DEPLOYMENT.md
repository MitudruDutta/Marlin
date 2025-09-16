# Marlin AI Agent Deployment Guide

This guide covers the complete setup and deployment of the Marlin AI Agent backend.

## Prerequisites

- Python 3.9 or higher
- Git
- Algorand node access (or use public endpoints)
- Google Gemini API key (for AI narratives)

## Step-by-Step Setup

### 1. Clone and Navigate to Project

```bash
git clone <your-repo-url>
cd marlin/projects/ai-agent
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp env.example .env

# Edit the .env file with your settings
```

#### Minimum Required Configuration

```bash
# .env file
NETWORK=testnet
ALGOD_ADDRESS=https://testnet-api.algonode.cloud
ALGOD_TOKEN=

# Required for AI narratives
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 5. Deploy Smart Contracts (Optional)

If you want to use the smart contract features:

```bash
cd ../marlin-contracts
# Follow the contract deployment guide
# After deployment, note down the app IDs and add them to your .env file
```

### 6. Test the Setup

```bash
# Test basic functionality without contracts
python -c "
import asyncio
from main import app
print('✓ Imports successful')
"
```

### 7. Run the API Server

```bash
# Development mode
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 8. Verify API is Running

Open your browser and go to:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

## Production Deployment

### Using Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t marlin-ai-agent .
docker run -p 8000:8000 --env-file .env marlin-ai-agent
```

### Using systemd (Linux)

Create a service file `/etc/systemd/system/marlin-ai.service`:

```ini
[Unit]
Description=Marlin AI Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/marlin/projects/ai-agent
Environment=PATH=/path/to/marlin/projects/ai-agent/venv/bin
ExecStart=/path/to/marlin/projects/ai-agent/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable marlin-ai
sudo systemctl start marlin-ai
```

## Configuration Options

### Network Selection

```bash
# Testnet (default)
NETWORK=testnet
ALGOD_ADDRESS=https://testnet-api.algonode.cloud

# Mainnet
NETWORK=mainnet
ALGOD_ADDRESS=https://mainnet-api.algonode.cloud

# Local development
NETWORK=localnet
ALGOD_ADDRESS=http://localhost:4001
ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

### ML Model Configuration

```bash
# Skip model training for faster startup during development
SKIP_MODEL_TRAIN=true

# Adjust model parameters
MODEL_WINDOW=30
MODEL_DEFAULT_DAYS=120
```

### API Features

```bash
# Enable AI narratives by default
INCLUDE_NARRATIVE_DEFAULT=true

# Configure DeFiLlama settings
CHAIN=algorand
LLAMA_TIMEOUT=30
```

## Smart Contract Integration

### Contract Deployment

1. Deploy contracts using the marlin-contracts project
2. Get the app IDs from deployment output
3. Add them to your `.env` file:

```bash
YIELD_TOKENIZATION_APP_ID=123456789
PT_TOKEN_APP_ID=123456790
YT_TOKEN_APP_ID=123456791
SIMPLE_AMM_APP_ID=123456792
STAKING_DAPP_APP_ID=123456793
PRICE_ORACLE_APP_ID=123456794
STANDARDIZED_WRAPPER_APP_ID=123456795
YT_AUTO_CONVERTER_APP_ID=123456796
```

### Account Setup

For contract interactions, you may need a funded account:

```bash
# Optional: Set deployer account mnemonic
DEPLOYER_MNEMONIC="your twenty four word mnemonic phrase here..."
```

## Monitoring and Logging

### Health Check Endpoint

Monitor your deployment with:

```bash
curl http://localhost:8000/health
```

Response includes:
- API status
- Model readiness
- Algorand connection
- Contract status
- Any startup errors

### Logging

The application logs to stdout. In production, consider:

```bash
# Redirect logs to file
uvicorn main:app --host 0.0.0.0 --port 8000 > app.log 2>&1

# Or use a process manager like supervisor
```

## Performance Tuning

### Model Training

For production, consider:

```bash
# Pre-train model and cache
SKIP_MODEL_TRAIN=false
MODEL_DEFAULT_DAYS=365  # More historical data
```

### Caching

The application includes built-in caching for:
- Price data (15s TTL)
- Historical data (10min TTL)
- Pool data (varies)

### Concurrent Requests

Adjust uvicorn workers for high load:

```bash
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Common Issues

1. **Import Error: AlgoKit not found**
   ```bash
   pip install algokit-utils py-algorand-sdk
   ```

2. **Gemini API Key Error**
   - Verify key is correct in `.env`
   - Check API quotas and billing

3. **Contract Connection Failed**
   - Verify network settings
   - Check app IDs are correct
   - Ensure contracts are deployed

4. **Model Training Failed**
   - Check internet connection for price data
   - Set `SKIP_MODEL_TRAIN=true` temporarily

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Testing API Endpoints

Use the interactive docs at `http://localhost:8000/docs` or test with curl:

```bash
# Test optimization endpoint
curl -X POST "http://localhost:8000/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "coin_id": "algorand",
    "risk_profile": "moderate", 
    "maturity_months": 6,
    "amount_algo": 1000
  }'

# Test DeFi recommendations
curl "http://localhost:8000/defi/recommend?amountAlgo=1000&horizonMonths=6&riskTolerance=moderate"
```

## Security Considerations

### API Security

- Use HTTPS in production
- Consider API rate limiting
- Validate all inputs
- Don't expose private keys in logs

### Environment Variables

- Never commit `.env` files
- Use secure secret management in production
- Rotate API keys regularly

### Network Security

- Restrict access to necessary ports only
- Use firewall rules
- Consider VPN for sensitive deployments

## Support

For issues and questions:
1. Check the logs for error details
2. Verify configuration against this guide
3. Test individual components separately
4. Check network connectivity and API limits
