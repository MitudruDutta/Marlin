"""
Marlin AI Agent Backend - FastAPI Application

This is the main FastAPI application that integrates with Algorand smart contracts
and provides AI-powered investment recommendations for the Marlin protocol.
"""

import os
import asyncio
import time
from enum import Enum
from typing import Optional, Tuple, Literal, Dict, Any, List
from contextlib import asynccontextmanager
import numpy as np
import httpx
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import our modules
from lstm import train_from_prices, predict_next_price
from defillama import router as llama_router
from algorand_integration import AlgorandClient, ContractManager

# Load environment variables
load_dotenv()

# Configuration
WINDOW = int(os.getenv("MODEL_WINDOW", "30"))
DEFAULT_DAYS = int(os.getenv("MODEL_DEFAULT_DAYS", "120"))
SKIP_MODEL_TRAIN = os.getenv("SKIP_MODEL_TRAIN", "0").lower() in {"1", "true", "yes", "on"}
USER_AGENT = os.getenv("USER_AGENT", "MarlinAI/1.0 (+https://marlin.ai)")
PUBLIC_ORIGIN = os.getenv("PUBLIC_ORIGIN", "").strip()

# DeFiLlama configuration
LLAMA_PRICES_BASE = "https://coins.llama.fi"
LLAMA_TIMEOUT = float(os.getenv("LLAMA_TIMEOUT", "30"))

# Algorand configuration
ALGORAND_NETWORK = os.getenv("NETWORK", "testnet")
ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud/")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")

# Coin mapping for DeFiLlama
COIN_MAP: Dict[str, Dict[str, str]] = {
    "bitcoin": {"llama_key": "coingecko:bitcoin"},
    "ethereum": {"llama_key": "coingecko:ethereum"},
    "avalanche-2": {"llama_key": "coingecko:avalanche-2"},
    "algorand": {"llama_key": "coingecko:algorand"},
    "aptos": {"llama_key": "coingecko:aptos"},
    "usd-coin": {"llama_key": "coingecko:usd-coin"},
}


class AppState:
    """Application state management"""
    model = None
    window = WINDOW
    startup_error: Optional[str] = None
    last_error: Optional[str] = None
    last_error_ts: Optional[float] = None
    algorand_client: Optional[AlgorandClient] = None
    contract_manager: Optional[ContractManager] = None


state = AppState()

# HTTP client management
_llama_client: Optional[httpx.AsyncClient] = None


def _llama_headers() -> dict:
    """Generate headers for DeFiLlama API requests"""
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if USER_AGENT:
        headers["User-Agent"] = USER_AGENT
    if PUBLIC_ORIGIN:
        headers["Referer"] = PUBLIC_ORIGIN
    return headers


def _get_llama_client() -> httpx.AsyncClient:
    """Get or create HTTP client for DeFiLlama"""
    global _llama_client
    if _llama_client is None:
        _llama_client = httpx.AsyncClient(
            timeout=LLAMA_TIMEOUT, 
            headers=_llama_headers()
        )
    return _llama_client


# Cache management
_cache: Dict[str, Tuple[float, Any]] = {}


def cache_get(key: str, ttl: int) -> Optional[Any]:
    """Get cached value if not expired"""
    row = _cache.get(key)
    if not row:
        return None
    ts, val = row
    if time.time() - ts > ttl:
        _cache.pop(key, None)
        return None
    return val


def cache_set(key: str, val: Any):
    """Set cached value with timestamp"""
    _cache[key] = (time.time(), val)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print("[startup] Initializing Marlin AI Agent Backend...")
    
    # Initialize Algorand client
    try:
        state.algorand_client = AlgorandClient(
            network=ALGORAND_NETWORK,
            algod_address=ALGOD_ADDRESS,
            algod_token=ALGOD_TOKEN
        )
        state.contract_manager = ContractManager(state.algorand_client)
        print(f"[startup] Algorand client initialized for {ALGORAND_NETWORK}")
    except Exception as e:
        state.startup_error = f"Algorand client initialization failed: {e}"
        print(f"[startup] {state.startup_error}")
    
    # Initialize ML model
    if SKIP_MODEL_TRAIN:
        print("[startup] SKIP_MODEL_TRAIN=1 -> skipping model training")
    else:
        try:
            hist = await get_coin_history("bitcoin", max(DEFAULT_DAYS, WINDOW + 25))
            prices = [p[1] for p in hist["prices"]]
            if len(prices) < WINDOW + 6:
                raise RuntimeError("Insufficient history to train model")
            
            state.model = train_from_prices(np.asarray(prices, dtype=float), window=WINDOW)
            print("[startup] LSTM model trained and ready")
        except Exception as e:
            state.startup_error = str(e)
            print(f"[startup] Model init failed: {e}")
    
    yield
    
    # Shutdown
    global _llama_client
    try:
        if _llama_client is not None:
            await _llama_client.aclose()
            _llama_client = None
    except Exception as e:
        print(f"[shutdown] Client close failed: {e}")


# FastAPI app initialization
app = FastAPI(
    title="Marlin AI Agent API",
    description="AI-powered investment recommendations for Algorand DeFi",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include DeFiLlama router
app.include_router(llama_router)


# Helper functions
def _coin_to_llama_key(coin_id: str) -> str:
    """Convert coin ID to DeFiLlama key"""
    if coin_id not in COIN_MAP:
        raise HTTPException(
            404, 
            f"No DeFiLlama mapping for coin_id '{coin_id}'. Add it to COIN_MAP."
        )
    return COIN_MAP[coin_id]["llama_key"]


def _safe_pct_change(new: Optional[float], old: Optional[float]) -> Optional[float]:
    """Calculate safe percentage change"""
    if new is None or old is None:
        return None
    if old == 0:
        return None
    return ((new - old) / (old + 1e-9)) * 100.0


# DeFiLlama API functions
async def llama_current_prices(coin_keys: List[str]) -> Dict[str, Any]:
    """Get current prices from DeFiLlama"""
    key = f"llama:current:{','.join(coin_keys)}"
    cached = cache_get(key, ttl=15)
    if cached is not None:
        return cached
    
    client = _get_llama_client()
    url = f"{LLAMA_PRICES_BASE}/prices/current/{','.join(coin_keys)}"
    r = await client.get(url)
    r.raise_for_status()
    js = r.json()
    cache_set(key, js)
    return js


async def llama_price_at(ts_sec: int, coin_key: str) -> Optional[float]:
    """Get price at specific timestamp from DeFiLlama"""
    key = f"llama:historical:{coin_key}:{ts_sec}"
    cached = cache_get(key, ttl=600)
    if cached is not None:
        return cached
    
    client = _get_llama_client()
    url = f"{LLAMA_PRICES_BASE}/prices/historical/{ts_sec}/{coin_key}"
    r = await client.get(url)
    if r.status_code == 404:
        cache_set(key, None)
        return None
    
    r.raise_for_status()
    js = r.json()
    price_obj = (js.get("coins") or {}).get(coin_key) or {}
    price = price_obj.get("price")
    price_f = float(price) if price is not None else None
    cache_set(key, price_f)
    return price_f


async def llama_daily_history(coin_id: str, days: int) -> List[Tuple[int, float]]:
    """Get daily price history from DeFiLlama"""
    if days < 1:
        raise HTTPException(400, "days must be >= 1")
    
    from datetime import datetime, timedelta, timezone
    
    coin_key = _coin_to_llama_key(coin_id)
    today = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    ts_list = [
        int((today - timedelta(days=i)).timestamp()) 
        for i in range(days, 0, -1)
    ]
    
    sem = asyncio.Semaphore(8)
    
    async def _fetch(ts: int):
        async with sem:
            try:
                price = await llama_price_at(ts, coin_key)
                return (ts * 1000, float(price)) if price is not None else None
            except Exception:
                return None
    
    results = await asyncio.gather(*[_fetch(ts) for ts in ts_list])
    pairs = [r for r in results if r]
    
    if not pairs:
        raise HTTPException(
            404, 
            f"No historical prices available for {coin_id} from DeFiLlama"
        )
    
    return pairs


# Price data functions
async def get_coin_history(coin_id: str, days: int):
    """Get coin price history"""
    pairs = await llama_daily_history(coin_id, days=days)
    pairs = sorted(set(pairs), key=lambda x: x[0])
    return {"prices": [[t, p] for t, p in pairs]}


async def get_coin_data(coin_id: str):
    """Get current coin data with price changes"""
    from datetime import datetime, timedelta, timezone
    
    coin_key = _coin_to_llama_key(coin_id)
    
    # Current price
    js_now = await llama_current_prices([coin_key])
    now_price = ((js_now.get("coins") or {}).get(coin_key) or {}).get("price")
    current = float(now_price) if now_price is not None else None
    
    # Historical anchors
    now = datetime.now(timezone.utc)
    ts_1h = int((now - timedelta(hours=1)).timestamp())
    ts_24h = int((now - timedelta(days=1)).timestamp())
    ts_7d = int((now - timedelta(days=7)).timestamp())
    
    p_1h = await llama_price_at(ts_1h, coin_key)
    p_24h = await llama_price_at(ts_24h, coin_key)
    p_7d = await llama_price_at(ts_7d, coin_key)
    
    return {
        "id": coin_id,
        "current_price": current,
        "price_change_percentage_1h_in_currency": _safe_pct_change(current, p_1h),
        "price_change_percentage_24h_in_currency": _safe_pct_change(current, p_24h),
        "price_change_percentage_7d_in_currency": _safe_pct_change(current, p_7d),
        "source": "defillama",
    }


# Risk and optimization models
class RiskProfile(str, Enum):
    aggressive = "aggressive"
    conservative = "conservative"
    moderate = "moderate"


def recommend_split(prices: List[float], risk_profile: Optional[RiskProfile] = None):
    """Recommend PT/YT split based on price volatility"""
    arr = np.asarray(prices[-state.window-1:], dtype=float)
    if arr.size < 3:
        return 0.5, 0.5
    
    ret = np.diff(np.log(arr + 1e-9))
    vol = float(np.std(ret))
    pt = float(np.clip(0.2 + (vol / 0.05), 0.2, 0.8))
    yt = 1.0 - pt
    
    if risk_profile == RiskProfile.conservative:
        pt = min(0.9, pt + 0.1)
        yt = 1.0 - pt
    elif risk_profile == RiskProfile.aggressive:
        yt = min(0.9, yt + 0.1)
        pt = 1.0 - yt
    
    return round(pt, 3), round(yt, 3)


def adjust_for_maturity(
    pt: float,
    yt: float,
    maturity_months: int,
    risk_profile: Optional[RiskProfile],
    trend: Optional[float] = None,
) -> Tuple[float, float]:
    """Adjust allocation based on maturity"""
    maturity_scale = {3: 0.0, 6: 0.33, 9: 0.66, 12: 1.0}.get(maturity_months, 0.0)
    MAX_TILT = 0.08
    tilt = MAX_TILT * maturity_scale
    
    if risk_profile == RiskProfile.conservative:
        pt = pt + tilt
        yt = 1.0 - pt
    elif risk_profile == RiskProfile.aggressive:
        yt = yt + tilt
        pt = 1.0 - yt
    else:
        if trend is not None:
            if trend > 0:
                yt = yt + 0.5 * tilt
                pt = 1.0 - yt
            elif trend < 0:
                pt = pt + 0.5 * tilt
                yt = 1.0 - pt
    
    pt = float(np.clip(pt, 0.1, 0.9))
    yt = float(np.clip(1.0 - pt, 0.1, 0.9))
    
    return round(pt, 3), round(yt, 3)


# Request models
class OptimizeRequest(BaseModel):
    coin_id: str = "algorand"
    risk_profile: Optional[RiskProfile] = None
    maturity_months: Literal[3, 6, 9, 12] = 6
    amount_algo: Optional[float] = None


class ContractInteractionRequest(BaseModel):
    action: str
    amount: Optional[float] = None
    maturity_timestamp: Optional[int] = None
    user_address: Optional[str] = None


# API Routes
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "ok": True,
        "model_ready": state.model is not None,
        "algorand_ready": state.algorand_client is not None,
        "window": state.window,
        "price_source": "defillama",
        "network": ALGORAND_NETWORK,
        "startup_error": state.startup_error,
        "last_error": state.last_error,
        "last_error_age_sec": (
            (time.time() - state.last_error_ts) 
            if state.last_error_ts else None
        ),
        "skip_model_train": SKIP_MODEL_TRAIN,
    }


@app.get("/coins/{coin_id}")
async def coin_data(coin_id: str):
    """Get current coin data"""
    return await get_coin_data(coin_id)


@app.get("/coins/{coin_id}/history")
async def coin_history(coin_id: str, days: int = DEFAULT_DAYS):
    """Get coin price history"""
    if days < 1:
        raise HTTPException(400, "days must be >= 1")
    return await get_coin_history(coin_id, days)


@app.post("/optimize")
async def optimize(req: OptimizeRequest = Body(...)):
    """Get AI-powered investment optimization recommendations"""
    if not state.model:
        raise HTTPException(503, "Model not ready; try again shortly")
    
    hist = await get_coin_history(req.coin_id, max(DEFAULT_DAYS, WINDOW + 6))
    prices = [p[1] for p in hist["prices"]]
    
    if len(prices) < state.window + 1:
        raise HTTPException(422, "Insufficient history for prediction")
    
    last_prices = np.asarray(prices[-(state.window + 1):], dtype=float)
    
    try:
        pred_next = predict_next_price(state.model, last_prices, window=state.window)
    except Exception as e:
        state.last_error = f"Prediction failed: {e}"
        state.last_error_ts = time.time()
        raise HTTPException(500, state.last_error)
    
    pt, yt = recommend_split(prices, req.risk_profile)
    last_price = float(last_prices[-1])
    trend = (float(pred_next) - last_price) / (last_price + 1e-9)
    
    pt, yt = adjust_for_maturity(
        pt, yt, req.maturity_months, req.risk_profile, trend=trend
    )
    
    # Get contract recommendations if amount is provided
    contract_recommendations = None
    if req.amount_algo and state.contract_manager:
        try:
            contract_recommendations = await state.contract_manager.get_investment_recommendations(
                amount_algo=req.amount_algo,
                pt_ratio=pt,
                yt_ratio=yt,
                maturity_months=req.maturity_months
            )
        except Exception as e:
            print(f"Contract recommendations failed: {e}")
    
    return {
        "coin_id": req.coin_id,
        "risk_profile": (req.risk_profile.value if req.risk_profile else "unspecified"),
        "maturity_months": req.maturity_months,
        "recommended_split": {"PT": pt, "YT": yt},
        "prediction": {
            "window": state.window,
            "last_price": float(last_price),
            "predicted_next_price": float(pred_next),
            "trend_estimate": round(trend, 6),
            "target": "log-return",
        },
        "contract_recommendations": contract_recommendations,
        "notes": {
            "logic": "Model predicts next log-return and converts to price.",
            "safety_clip_log_return": "[-0.3, 0.3]",
            "data_source": "DeFiLlama (coins.llama.fi)",
            "network": ALGORAND_NETWORK,
        },
    }


@app.post("/contracts/interact")
async def interact_with_contracts(req: ContractInteractionRequest = Body(...)):
    """Interact with Algorand smart contracts"""
    if not state.contract_manager:
        raise HTTPException(503, "Contract manager not ready")
    
    try:
        result = await state.contract_manager.execute_action(
            action=req.action,
            amount=req.amount,
            maturity_timestamp=req.maturity_timestamp,
            user_address=req.user_address
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Contract interaction failed: {e}")


@app.get("/contracts/status")
async def get_contract_status():
    """Get status of deployed contracts"""
    if not state.contract_manager:
        raise HTTPException(503, "Contract manager not ready")
    
    try:
        status = await state.contract_manager.get_contract_status()
        return status
    except Exception as e:
        raise HTTPException(500, f"Failed to get contract status: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)