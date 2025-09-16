"""
DeFiLlama Integration Module

This module provides comprehensive DeFiLlama API integration for yield farming
recommendations and price data, specifically optimized for Algorand DeFi protocols.
"""

import os
from typing import List, Optional, Dict, Any, Set, Tuple
import math
import httpx
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configuration
CHAIN_DEFAULT = os.getenv("CHAIN", "algorand").strip().lower()
LLAMA_YIELDS = os.getenv("LLAMA_YIELDS", "https://yields.llama.fi/pools")
LLAMA_PRICES = os.getenv("LLAMA_PRICES", "https://coins.llama.fi/prices/current")
WALGO_ADDR = os.getenv("WALGO_ADDR", "0")

# Gemini AI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
INCLUDE_NARRATIVE_DEFAULT = os.getenv("INCLUDE_NARRATIVE_DEFAULT", "false").lower() in {
    "1", "true", "yes", "on"
}

router = APIRouter(prefix="/defi", tags=["defillama"])

# =========================
# Gemini AI Integration
# =========================

_gemini_configured = False


def _configure_gemini() -> bool:
    """Configure Gemini AI client"""
    global _gemini_configured
    if _gemini_configured:
        return True
    
    if not GEMINI_API_KEY:
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_configured = True
        return True
    except Exception:
        return False


def _get_gemini_model():
    """Get Gemini model instance"""
    if not _configure_gemini():
        return None
    
    try:
        return genai.GenerativeModel(GEMINI_MODEL)
    except Exception:
        return None


def _risk_label(period_return_pct: float, downside_period: float) -> str:
    """Generate risk label based on return and downside metrics"""
    pr = period_return_pct or 0.0
    ds = downside_period or 0.0
    
    if ds >= 0.25:
        return "High risk / high return" if pr >= 6 else "High risk / uncertain return"
    if ds <= 0.10:
        return "Low risk / conservative return" if pr <= 5 else "Low risk / efficient return"
    return "Moderate risk / balanced return"


def _build_narrative_prompt(row: Dict[str, Any], inputs: Dict[str, Any]) -> str:
    """Build prompt for AI narrative generation"""
    risk_line = _risk_label(row.get("periodReturnPct", 0.0), row.get("downsidePeriod", 0.0))
    style = (row.get("why") or {}).get("style") or (row.get("category") or "pool")
    exposure = row.get("exposure") or "unknown exposure"
    il_pen = (row.get("why") or {}).get("ilPenaltyPctPts")
    tvl = row.get("tvlUsd") or 0.0
    apy_now = float(row.get("apy_now") or 0.0)
    apy_net = float(row.get("apy_net_estimate") or 0.0)
    throughput = float(row.get("throughput") or 0.0)
    conf = float(row.get("conf") or 0.0)
    period_return = float(row.get("periodReturnPct") or 0.0)
    profit_algo = row.get("profitAlgo")
    profit_usd = row.get("profitUsd")
    url = row.get("url") or ""
    
    usd_tail = f" (~${profit_usd:,.2f})" if isinstance(profit_usd, (int, float)) else ""
    
    return f"""You are a helpful, concise investment explainer for DeFi pools. Write 1 short paragraph (120–160 words).

Audience: a crypto user deciding where to deploy LP capital on Algorand.

INPUTS
- User amount: {inputs.get('amountAlgo')} ALGO
- Horizon: {inputs.get('horizonMonths')} months
- Risk tolerance: {inputs.get('riskTolerance')}
- Pool: {row.get('project')} — {row.get('symbol')} (category: {style}, exposure: {exposure})
- Link: {url}
- TVL: ${tvl:,.0f}
- Current APY (raw): {apy_now:.3f}%
- Net APY (risk-adjusted estimate): {apy_net:.3f}%
- Expected period return over horizon: {period_return:.2f}%
- Expected profit at maturity: {profit_algo} ALGO{usd_tail}
- Liquidity/throughput score: {throughput:.3f}
- Confidence proxy: {conf:.3f}
- Downside (horizon-scaled): {row.get('downsidePeriod'):.3f}
- Risk/return style: {risk_line}
- Impermanent loss penalty applied (pct pts): {il_pen}

TASK
- In a neutral, professional tone, explain:
  1) Why this pool might fit the user's inputs (horizon, risk),
  2) What drives the return (fees vs rewards) and the main risks (IL if dual, volatility),
  3) A plain-English read on the profit figure above,
  4) A brief caution if TVL/throughput/confidence is low.
- Avoid hype. Be specific to the data above. Do NOT promise outcomes.
- End with a one-sentence disclaimer: "Not financial advice."
"""


async def _generate_narrative_for_rows(
    rows: List[Dict[str, Any]], 
    inputs: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate AI narratives for pool recommendations"""
    model = _get_gemini_model()
    if model is None:
        return []
    
    out = []
    for row in rows:
        prompt = _build_narrative_prompt(row, inputs)
        try:
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=300,
            )
            
            # Generate response
            response = model.generate_content(
                f"You are a concise DeFi investment explainer.\n\n{prompt}",
                generation_config=generation_config
            )
            text = (response.text or "").strip()
        except Exception as e:
            text = f"(Narrative unavailable: {e})"
        
        out.append({
            "pool": row.get("pool"),
            "project": row.get("project"),
            "symbol": row.get("symbol"),
            "text": text
        })
    
    return out


# =========================
# DeFiLlama API Functions
# =========================

def _best_match(pools: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find best pool match by TVL"""
    if not pools:
        return None
    return sorted(pools, key=lambda p: float(p.get("tvlUsd") or 0.0), reverse=True)[0]


def _coins_key(chain: str, token_addr: str) -> Optional[str]:
    """Generate DeFiLlama coin key"""
    if not token_addr:
        return None
    
    chain_key = {
        "algorand": "algorand",
        "aptos": "aptos",
        "avalanche": "avax",
        "avalanche-c": "avax",
        "ethereum": "ethereum",
        "polygon": "polygon",
        "bsc": "bsc",
        "arbitrum": "arbitrum",
        "optimism": "optimism",
    }.get(chain.lower(), chain.lower())
    
    return f"{chain_key}:{token_addr.lower()}"


async def _fetch_llama_pools(
    chain: str, 
    project: Optional[str], 
    search: Optional[str]
) -> List[Dict[str, Any]]:
    """Fetch pools from DeFiLlama API"""
    params = {}
    if chain:
        params["chain"] = chain
    if project:
        params["project"] = project
    if search:
        params["search"] = search
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(LLAMA_YIELDS, params=params)
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        
        data = r.json()
        pools = data.get("data", data)
        return pools if isinstance(pools, list) else []


async def _fetch_prices_usd(
    chain: str, 
    token_addresses: List[str]
) -> Dict[str, float]:
    """Fetch token prices from DeFiLlama"""
    coins = []
    for addr in token_addresses:
        key = _coins_key(chain, addr)
        if key:
            coins.append(key)
    
    if not coins:
        return {}
    
    url = f"{LLAMA_PRICES}/" + ",".join(coins)
    
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        if r.status_code >= 400:
            return {}
        
        payload = r.json() or {}
        coins_map = payload.get("coins", {})
        
        out: Dict[str, float] = {}
        for coin_key, info in coins_map.items():
            addr = coin_key.split(":", 1)[-1].lower()
            price = info.get("price")
            if isinstance(price, (int, float)):
                out[addr] = float(price)
        
        return out


async def _fetch_algo_usd_price() -> Optional[float]:
    """Fetch ALGO/USD price"""
    key = f"algorand:{WALGO_ADDR.lower()}"
    url = f"{LLAMA_PRICES}/{key}"
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url)
            if r.status_code >= 400:
                return None
            
            coins = (r.json() or {}).get("coins", {})
            info = coins.get(key)
            price = (info or {}).get("price")
            return float(price) if isinstance(price, (int, float)) else None
    except Exception:
        return None


def _profitability_view(pool: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate profitability metrics for a pool"""
    apy = pool.get("apy")
    apy_base = pool.get("apyBase")
    apy_reward = pool.get("apyReward")
    
    net_apy = None
    try:
        parts = [float(x) for x in [apy] if x is not None]
        if parts:
            net_apy = parts[0]
        else:
            base = float(apy_base) if apy_base is not None else 0.0
            rew = float(apy_reward) if apy_reward is not None else 0.0
            net_apy = base + rew
    except Exception:
        net_apy = None
    
    flags = {
        "hasRewards": apy_reward not in (None, 0, 0.0),
        "isStableLike": bool(
            str(pool.get("symbol", "")).upper().count("USD") or 
            "DAI" in str(pool.get("symbol", "")).upper()
        ),
    }
    
    return {
        "apy": apy,
        "apyBase": apy_base,
        "apyReward": apy_reward,
        "netApy": net_apy,
        "flags": flags
    }


# =========================
# Pool Scoring and Ranking
# =========================

def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp value between bounds"""
    return max(lo, min(hi, x))


def _sigmoid(x: float) -> float:
    """Sigmoid activation function"""
    return 1.0 / (1.0 + math.exp(-x))


# Risk presets for different user profiles
RISK_PRESETS = {
    "conservative": {
        "w_return": 0.45, "w_throughput": 0.20, "w_tvl": 0.25, "w_conf": 0.10,
        "il_mult": 1.25, "vol_floor": 0.15, "min_tvl_usd": 5_000_000
    },
    "moderate": {
        "w_return": 0.55, "w_throughput": 0.20, "w_tvl": 0.15, "w_conf": 0.10,
        "il_mult": 1.00, "vol_floor": 0.10, "min_tvl_usd": 1_000_000
    },
    "aggressive": {
        "w_return": 0.65, "w_throughput": 0.20, "w_tvl": 0.05, "w_conf": 0.10,
        "il_mult": 0.75, "vol_floor": 0.07, "min_tvl_usd": 100_000
    },
}

# MCDA weights for TOPSIS ranking
MCDA_WEIGHTS = {
    "conservative": {
        "periodReturnPct": 0.30, "tvlUsd": 0.25, "throughput": 0.15, "conf": 0.10,
        "downsidePeriod": 0.15, "ilPenaltyPctPts": 0.05,
    },
    "moderate": {
        "periodReturnPct": 0.40, "tvlUsd": 0.15, "throughput": 0.20, "conf": 0.10,
        "downsidePeriod": 0.10, "ilPenaltyPctPts": 0.05,
    },
    "aggressive": {
        "periodReturnPct": 0.50, "tvlUsd": 0.10, "throughput": 0.20, "conf": 0.10,
        "downsidePeriod": 0.07, "ilPenaltyPctPts": 0.03,
    },
}

# Risk category bias adjustments
RISK_CATEGORY_BIAS = {
    "conservative": {
        "stable": +0.15, "lending": +0.10, "bluechip": +0.08,
        "farm": -0.12, "derivatives": -0.15, "volatile": -0.10
    },
    "moderate": {
        "stable": +0.05, "lending": +0.03, "bluechip": +0.03,
        "farm": +0.03, "volatile": 0.00, "derivatives": -0.05
    },
    "aggressive": {
        "farm": +0.15, "volatile": +0.10, "derivatives": +0.08,
        "stable": -0.10, "lending": -0.05, "bluechip": 0.00
    },
}


def _pool_style(pool: Dict[str, Any]) -> str:
    """Classify pool style for risk assessment"""
    cat = (pool.get("category") or "").lower()
    sym = (pool.get("symbol") or "").upper()
    proj = (pool.get("project") or "").lower()
    
    if "lend" in cat or proj in {"aave-v3", "benqi", "radiant"}:
        return "lending"
    
    if "stable" in cat or any(x in sym for x in ["USDC", "USDT", "DAI", "FRAX", "USD"]):
        return "stable"
    
    if "deriv" in cat or "perp" in cat:
        return "derivatives"
    
    if proj in {"trader-joe", "pangolin", "camelot", "sushiswap", "woo-fi"}:
        if any(x in sym for x in ["USDC", "USDT", "DAI", "USD"]):
            return "stable"
        return "farm"
    
    if any(x in sym for x in ["BTC", "WBTC", "ETH", "WETH"]) and (
        pool.get("exposure") or ""
    ).lower() == "single":
        return "bluechip"
    
    return "volatile"


def _monthly_vol_guess(pool: Dict[str, Any]) -> float:
    """Estimate monthly volatility for a pool"""
    if pool.get("sigma") is not None:
        try:
            return max(0.02, float(pool["sigma"]))
        except Exception:
            pass
    
    if pool.get("stablecoin"):
        return 0.03
    
    sym = (pool.get("symbol") or "").upper()
    if any(x in sym for x in ["BTC", "WBTC", "ETH", "WETH"]):
        return 0.40
    
    return 0.80


def _apy_forward(pool: Dict[str, Any]) -> float:
    """Calculate forward-looking APY estimate"""
    apy = float(pool.get("apy") or 0.0)
    apy30 = float(pool.get("apyMean30d") or apy)
    apy7 = float(pool.get("apyPct7D") or 0.0)
    
    return 0.5 * apy + 0.3 * apy30 + 0.2 * (apy * (1.0 + apy7 / 100.0))


def _reward_haircut(pool: Dict[str, Any], throughput: float, conf: float) -> float:
    """Apply haircut to reward APY based on liquidity and confidence"""
    apyReward = float(pool.get("apyReward") or 0.0)
    if apyReward <= 0:
        return 0.0
    
    k_liq = 0.4 * throughput + 0.6 * conf
    return apyReward * k_liq


def _expected_il_pct(pool: Dict[str, Any], horizon_months: int, il_mult: float) -> float:
    """Calculate expected impermanent loss percentage"""
    exposure = (pool.get("exposure") or "").lower()
    ilRisk = (pool.get("ilRisk") or "").lower()
    
    if exposure == "single" or ilRisk == "no":
        return 0.0
    
    sigma_m = _monthly_vol_guess(pool)
    return il_mult * 0.5 * (sigma_m ** 2) * horizon_months * 100.0


def _project_end_amount(amount_algo: float, apy_net_pct: float, months: int) -> float:
    """Project final amount after compound growth"""
    r = apy_net_pct / 100.0
    return amount_algo * ((1 + r / 12.0) ** max(1, months))


def _is_number(x) -> bool:
    """Check if value is numeric"""
    try:
        float(x)
        return True
    except (TypeError, ValueError):
        return False


def _score_pool(
    pool: Dict[str, Any], 
    amount_algo: float, 
    horizon_months: int, 
    risk: str
) -> Optional[Dict[str, Any]]:
    """Score a pool based on user parameters and risk profile"""
    rp = RISK_PRESETS[risk]
    tvl = float(pool.get("tvlUsd") or 0.0)
    
    # Only consider Algorand pools
    if (pool.get("chain") or "").lower() != "algorand":
        return None
    
    # Calculate throughput score
    vol7d_raw = pool.get("volumeUsd7d")
    vol7d = float(vol7d_raw) if _is_number(vol7d_raw) else 0.0
    throughput = _clamp((vol7d / (tvl * 7.0)) if tvl > 0 and vol7d > 0 else 0.0, 0, 1)
    
    # Calculate confidence score
    pred_prob = (pool.get("predictions") or {}).get("predictedProbability")
    conf = _clamp((float(pred_prob) / 80.0) if _is_number(pred_prob) else 0.5, 0.0, 1.0)
    
    # Calculate adjusted APY
    apy_fwd = _apy_forward(pool)
    apyReward = float(pool.get("apyReward") or 0.0)
    apy_adj = apy_fwd - apyReward + _reward_haircut(pool, throughput, conf)
    
    # Apply impermanent loss penalty
    exposure = (pool.get("exposure") or "").lower()
    il_pen = _expected_il_pct(pool, horizon_months, rp["il_mult"])
    apy_net = apy_adj - il_pen
    
    # Calculate period return and risk metrics
    r_annual = apy_net / 100.0
    period_return = (1.0 + r_annual / 12.0) ** max(1, horizon_months) - 1.0
    
    downside_raw = pool.get("sigma")
    downside_annual = float(downside_raw) if _is_number(downside_raw) else rp["vol_floor"]
    downside_annual = max(rp["vol_floor"], downside_annual)
    downside_period = downside_annual * (max(1, horizon_months) / 12.0) ** 0.5
    
    # Apply exposure bias
    exposure_bias = 0.0
    if exposure != "single":
        if risk == "conservative":
            exposure_bias = -0.05
        elif risk == "aggressive":
            exposure_bias = +0.02
    
    # Calculate risk-adjusted return
    rar = (period_return / max(1e-6, downside_period))
    
    # Calculate TVL score
    tvl_score = _clamp((math.log10(tvl) / 10.0) if tvl > 0 else 0.0, 0.0, 1.0)
    
    # Calculate composite score
    score = 100.0 * (
        rp["w_return"] * _sigmoid((period_return * 100.0) / 5.0) +
        rp["w_throughput"] * throughput +
        rp["w_tvl"] * tvl_score +
        rp["w_conf"] * conf
    ) + 100.0 * exposure_bias
    
    # Apply style bias
    style = _pool_style(pool)
    bias_map = RISK_CATEGORY_BIAS.get(risk, {})
    score += 100.0 * bias_map.get(style, 0.0)
    
    # Calculate projected amounts
    end_amount_algo = _project_end_amount(amount_algo, apy_net, horizon_months)
    profit_algo = end_amount_algo - amount_algo
    
    return {
        "pool": pool.get("pool"),
        "project": pool.get("project"),
        "chain": pool.get("chain"),
        "symbol": pool.get("symbol"),
        "url": pool.get("url"),
        "category": pool.get("category"),
        "tvlUsd": tvl,
        "apy_now": float(pool.get("apy") or 0.0),
        "apy_net_estimate": round(apy_net, 4),
        "periodReturnPct": round(period_return * 100.0, 4),
        "downsidePeriod": round(downside_period, 6),
        "RAR": round(rar, 4),
        "Score": round(score, 2),
        "throughput": round(throughput, 6),
        "conf": round(conf, 6),
        "amountStartALGO": amount_algo,
        "amountEndALGO": round(end_amount_algo, 6),
        "profitAlgo": round(profit_algo, 6),
        "horizonMonths": horizon_months,
        "why": {
            "tvlScore": round(tvl_score, 3),
            "ilPenaltyPctPts": round(il_pen, 3),
            "exposureBias": exposure_bias,
            "style": style
        },
        "exposure": pool.get("exposure"),
        "ilRisk": pool.get("ilRisk"),
        "underlyingTokens": pool.get("underlyingTokens"),
    }


def _topsis_rank(rows: List[Dict[str, Any]], risk: str) -> List[Dict[str, Any]]:
    """Rank pools using TOPSIS multi-criteria decision analysis"""
    if not rows:
        return []
    
    # Define criteria (name, direction)
    crit = [
        ("periodReturnPct", "benefit"),
        ("tvlUsd", "benefit"),
        ("throughput", "benefit"),
        ("conf", "benefit"),
        ("downsidePeriod", "cost"),
        ("why.ilPenaltyPctPts", "cost"),
    ]
    
    # Get weights for risk profile
    weights = MCDA_WEIGHTS[risk]
    w_sum = sum(weights.values())
    w = {k: (weights[k] / w_sum if w_sum > 0 else 0.0) for k in weights}
    
    def _get(row: Dict[str, Any], path: str) -> float:
        """Get nested dictionary value"""
        cur: Any = row
        for p in path.split("."):
            cur = cur.get(p) if isinstance(cur, dict) else None
        return float(cur) if _is_number(cur) else 0.0
    
    # Collect column values
    col_vals: Dict[str, List[float]] = {c[0]: [] for c in crit}
    for r in rows:
        for c, _ in crit:
            col_vals[c].append(_get(r, c))
    
    # Calculate normalization factors
    col_norm: Dict[str, float] = {}
    for c, vals in col_vals.items():
        s = math.sqrt(sum((float(v) ** 2) for v in vals))
        col_norm[c] = s if s > 0 else 1.0
    
    # Normalize and weight
    wn: List[Dict[str, float]] = []
    for r in rows:
        roww = {}
        for c, _dir in crit:
            vn = _get(r, c) / col_norm[c]
            key_for_weight = c if c in w else c.split(".")[-1]
            roww[c] = vn * w.get(key_for_weight, 0.0)
        wn.append(roww)
    
    # Find ideal solutions
    ideal_best, ideal_worst = {}, {}
    for c, direction in crit:
        col = [rw[c] for rw in wn]
        if direction == "benefit":
            ideal_best[c], ideal_worst[c] = max(col), min(col)
        else:
            ideal_best[c], ideal_worst[c] = min(col), max(col)
    
    # Calculate TOPSIS scores
    scores = []
    for rw in wn:
        d_plus = math.sqrt(sum((rw[c] - ideal_best[c]) ** 2 for c, _ in crit))
        d_minus = math.sqrt(sum((rw[c] - ideal_worst[c]) ** 2 for c, _ in crit))
        denom = d_plus + d_minus
        cc = (d_minus / denom) if denom > 0 else 0.5
        scores.append(cc)
    
    # Add scores and sort
    out = []
    for r, cc in zip(rows, scores):
        r2 = dict(r)
        r2["topsisScore"] = round(float(cc), 6)
        out.append(r2)
    
    out.sort(key=lambda x: (-x["topsisScore"], -x["Score"], -x["RAR"], -x["periodReturnPct"]))
    return out


def _dedupe_by_project_symbol(pools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate pools, keeping highest TVL"""
    buckets: Dict[Tuple[str, str], Dict[str, Any]] = {}
    
    for p in pools:
        key = ((p.get("project") or "").lower(), (p.get("symbol") or "").upper())
        cur = buckets.get(key)
        if cur is None or float(p.get("tvlUsd") or 0.0) > float(cur.get("tvlUsd") or 0.0):
            buckets[key] = p
    
    return list(buckets.values())


def _relax_tvl_floor(base_floor: float, relax_level: int) -> float:
    """Relax TVL floor requirements progressively"""
    factors = [1.0, 0.6, 0.4, 0.2, 0.0]
    f = factors[relax_level] if relax_level < len(factors) else 0.0
    return base_floor * f


def _rank_topN(
    pools: List[Dict[str, Any]], 
    amount_algo: float, 
    horizon_months: int, 
    risk: str, 
    topN: int
) -> List[Dict[str, Any]]:
    """Rank and return top N pools"""
    if topN <= 0:
        return []
    
    # Score all pools
    scored: List[Dict[str, Any]] = []
    for p in pools:
        s = _score_pool(p, amount_algo, horizon_months, risk)
        if s:
            scored.append(s)
    
    # Rank using TOPSIS
    ranked = _topsis_rank(scored, risk)
    
    # Diversify by project
    diversified: List[Dict[str, Any]] = []
    seen_proj: Set[str] = set()
    
    for row in ranked:
        proj = (row.get("project") or "").lower()
        if proj in seen_proj:
            continue
        diversified.append(row)
        seen_proj.add(proj)
        if len(diversified) >= topN:
            break
    
    # Fill remaining slots if needed
    if len(diversified) < topN:
        for row in ranked:
            if row not in diversified:
                diversified.append(row)
                if len(diversified) >= topN:
                    break
    
    return diversified[:topN]


# =========================
# API Endpoints
# =========================

@router.get("/pools", summary="List pools from DeFiLlama (filterable)")
async def list_pools(
    chain: str = Query(CHAIN_DEFAULT, description="E.g., algorand"),
    project: Optional[str] = Query(None, description="E.g., trader-joe, pangolin"),
    search: Optional[str] = Query(None, description="Search text, e.g., WAVAX or WAVAX/USDC"),
    limit: int = Query(10, ge=1, le=100),
):
    """List DeFi pools with filtering options"""
    pools = await _fetch_llama_pools(chain=chain, project=project, search=search)
    pools = pools[:limit]
    return {"count": len(pools), "results": pools}


@router.get("/lp", summary="Get a single best-match LP with APY/TVL/Prices")
async def get_lp(
    query: str = Query(..., description="Pool name or token symbols (e.g., 'WAVAX/USDC' or 'WAVAX')"),
    chain: str = Query(CHAIN_DEFAULT),
    project: Optional[str] = Query(None, description="Optionally restrict to a protocol (e.g., trader-joe, pangolin)"),
):
    """Get detailed information for a specific liquidity pool"""
    pools = await _fetch_llama_pools(chain=chain, project=project, search=query)
    
    if not pools:
        raise HTTPException(status_code=404, detail=f"No pools found on {chain} for '{query}'")
    
    pool = _best_match(pools)
    if not pool:
        raise HTTPException(status_code=404, detail="No suitable pool returned by DeFiLlama")
    
    underlying = pool.get("underlyingTokens") or []
    prices = await _fetch_prices_usd(chain, underlying) if underlying else {}
    prof = _profitability_view(pool)
    
    result = {
        "query": query,
        "chain": chain,
        "project": pool.get("project"),
        "poolId": pool.get("pool"),
        "name": pool.get("symbol"),
        "url": pool.get("url"),
        "tvlUsd": pool.get("tvlUsd"),
        "apy": {
            "total": prof["netApy"],
            "base": prof["apyBase"],
            "reward": prof["apyReward"],
            "raw": pool.get("apy"),
            "updatedAt": pool.get("timestamp") or pool.get("updatedAt"),
        },
        "tokens": {
            "underlyingTokens": underlying,
            "rewardTokens": pool.get("rewardTokens") or [],
            "pricesUsd": prices,
        },
        "risks": {
            "stableLike": prof["flags"]["isStableLike"],
            "hasIncentives": prof["flags"]["hasRewards"],
        },
        "extra": {
            "ilRisk": pool.get("ilRisk"),
            "poolMeta": pool.get("poolMeta"),
            "chain": pool.get("chain"),
            "category": pool.get("category"),
        },
        "source": "DeFiLlama Yields + Coin Prices",
    }
    
    return result


@router.get("/recommend", summary="Top N Algorand pools for your amount/horizon/risk (MCDA/TOPSIS)")
async def recommend(
    amountAlgo: float = Query(..., gt=0, description="Amount you plan to invest, in ALGO units"),
    horizonMonths: int = Query(..., description="3, 6, 9, or 12"),
    riskTolerance: str = Query(..., description="'conservative' | 'moderate' | 'aggressive'"),
    project: Optional[str] = Query(None, description="Optionally restrict to protocol (e.g., trader-joe, pangolin, aave-v3, benqi)"),
    search: Optional[str] = Query(None, description="Optional DeFiLlama search text"),
    chain: str = Query(CHAIN_DEFAULT, description="Defaults to 'algorand'"),
    limitFetch: int = Query(600, ge=50, le=2000, description="How many pools to fetch before ranking"),
    topN: int = Query(2, ge=1, le=5, description="How many results to return (default 2)"),
    includeNarrative: bool = Query(None, description="If true, uses AI to add a paragraph per result"),
):
    """Get AI-powered pool recommendations based on user parameters"""
    # Use environment default when includeNarrative is omitted
    if includeNarrative is None:
        includeNarrative = INCLUDE_NARRATIVE_DEFAULT
    
    risk = (riskTolerance or "moderate").lower()
    if risk not in RISK_PRESETS:
        raise HTTPException(
            status_code=400, 
            detail="riskTolerance must be conservative|moderate|aggressive"
        )
    
    # Fetch pools with search and without search for broader coverage
    pools_main = await _fetch_llama_pools(chain=chain, project=project, search=search)
    pools_broad = await _fetch_llama_pools(chain=chain, project=project, search=None) if search else []
    
    # Deduplicate by pool ID, keeping highest TVL
    by_id: Dict[str, Dict[str, Any]] = {}
    for p in (pools_main + pools_broad):
        pid = p.get("pool")
        if not pid:
            continue
        cur = by_id.get(pid)
        if cur is None or float(p.get("tvlUsd") or 0.0) > float(cur.get("tvlUsd") or 0.0):
            by_id[pid] = p
    
    pools_all = list(by_id.values())
    pools_all.sort(key=lambda x: float(x.get("tvlUsd") or 0.0), reverse=True)
    pools_all = _dedupe_by_project_symbol(pools_all)[:limitFetch]
    
    # Progressive TVL floor relaxation to ensure results
    base_floor = float(RISK_PRESETS[risk]["min_tvl_usd"])
    results: List[Dict[str, Any]] = []
    tvl_floor_used = base_floor
    
    for relax in range(0, 5):
        tvl_floor = _relax_tvl_floor(base_floor, relax)
        tvl_floor_used = tvl_floor
        
        candidates = [
            p for p in pools_all
            if (p.get("chain") or "").lower() == "algorand"
            and float(p.get("tvlUsd") or 0.0) >= tvl_floor
        ]
        
        results = _rank_topN(candidates, amountAlgo, horizonMonths, risk, topN=topN)
        if len(results) >= topN:
            break
    
    # Add ALGO price and profit calculations
    algo_price = await _fetch_algo_usd_price()
    for row in results:
        profit_algo = float(row["amountEndALGO"]) - float(row["amountStartALGO"])
        row["profitAlgo"] = round(profit_algo, 6)
        row["algoPriceUsd"] = float(algo_price) if isinstance(algo_price, (int, float)) else None
        row["profitUsd"] = (
            round(profit_algo * float(algo_price), 2) 
            if isinstance(algo_price, (int, float)) else None
        )
        row["tvlFloorApplied"] = tvl_floor_used
    
    # Generate AI narratives if requested
    inputs_dict = {
        "amountAlgo": amountAlgo,
        "horizonMonths": horizonMonths,
        "riskTolerance": risk,
    }
    
    explanations: List[Dict[str, Any]] = []
    if includeNarrative and results:
        explanations = await _generate_narrative_for_rows(results, inputs_dict)
    
    return {
        "inputs": {
            "amountAlgo": amountAlgo,
            "horizonMonths": horizonMonths,
            "riskTolerance": risk,
            "chain": chain,
            "project": project,
            "search": search,
            "limitFetch": limitFetch,
            "topN": topN,
            "includeNarrative": includeNarrative,
        },
        "universeCount": len(pools_all),
        "tvlFloorUsed": tvl_floor_used,
        "topN": results,
        "explanations": explanations,
    }