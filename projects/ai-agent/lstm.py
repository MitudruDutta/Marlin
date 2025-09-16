"""
LSTM Model for Price Prediction

This module provides LSTM-based price prediction functionality for the Marlin AI agent.
It uses scikit-learn's GradientBoostingRegressor on log-returns for stability.
"""

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor


def _make_supervised_from_returns(returns: np.ndarray, window: int):
    """
    Create supervised dataset from STATIONARY log-returns.
    
    Args:
        returns: Array of log-returns
        window: Lookback window size
        
    Returns:
        X: Feature matrix [samples, window]
        y: Target vector [samples]
        
    Where:
        X[i] = [r_{i-window}, ..., r_{i-1}]
        y[i] = r_i
        r_t = log(P_t / P_{t-1})
    """
    r = np.asarray(returns, dtype=float).flatten()
    
    if r.ndim != 1:
        raise ValueError("returns must be 1D")
    if len(r) <= window:
        raise ValueError("not enough returns for chosen window")
    
    X, y = [], []
    for i in range(window, len(r)):
        X.append(r[i - window:i])
        y.append(r[i])
    
    return np.asarray(X), np.asarray(y)


def _prices_to_returns(prices: np.ndarray) -> np.ndarray:
    """
    Convert prices to log-returns.
    
    Args:
        prices: Array of prices
        
    Returns:
        Array of log-returns
    """
    p = np.asarray(prices, dtype=float).flatten()
    
    if p.ndim != 1 or len(p) < 2:
        raise ValueError("need at least 2 prices to compute returns")
    
    # Log-returns are more stable than simple percentage changes
    return np.diff(np.log(p + 1e-12))


def train_from_prices(prices: np.ndarray, window: int = 30) -> Pipeline:
    """
    Train LSTM-style model from price data.
    
    Args:
        prices: Historical price data
        window: Lookback window for features
        
    Returns:
        Trained sklearn Pipeline
    """
    returns = _prices_to_returns(prices)
    X, y = _make_supervised_from_returns(returns, window)
    
    # Use GradientBoostingRegressor which works well for time series
    model = Pipeline(steps=[
        ("scaler", StandardScaler()),  # Helpful for non-tree models; harmless here
        ("gbr", GradientBoostingRegressor(
            n_estimators=400,
            max_depth=3,
            learning_rate=0.05,
            random_state=42,
            subsample=0.9
        )),
    ])
    
    model.fit(X, y)
    return model


def predict_next_price(
    model: Pipeline, 
    last_window_prices: np.ndarray, 
    window: int = 30
) -> float:
    """
    Predict next price using trained model.
    
    Args:
        model: Trained model pipeline
        last_window_prices: Recent price history
        window: Window size used in training
        
    Returns:
        Predicted next price
    """
    p = np.asarray(last_window_prices, dtype=float).flatten()
    
    if len(p) < window + 1:
        raise ValueError(f"need at least {window+1} prices, got {len(p)}")
    
    last_price = float(p[-1])
    r_window = _prices_to_returns(p)  # length == window
    
    X = r_window.reshape(1, -1)
    r_hat = float(model.predict(X)[0])
    
    # Safety clip to avoid wild outliers from the regressor (≈ ±30% move in log terms)
    r_hat = float(np.clip(r_hat, -0.3, 0.3))
    
    # Convert log-return back to price
    next_price = last_price * float(np.exp(r_hat))
    
    return next_price


def calculate_volatility(prices: np.ndarray, window: int = 30) -> float:
    """
    Calculate rolling volatility from prices.
    
    Args:
        prices: Price array
        window: Rolling window size
        
    Returns:
        Annualized volatility
    """
    returns = _prices_to_returns(prices)
    
    if len(returns) < window:
        return np.std(returns) * np.sqrt(252)  # Annualized
    
    # Use last window for volatility calculation
    recent_returns = returns[-window:]
    return np.std(recent_returns) * np.sqrt(252)


def calculate_sharpe_ratio(prices: np.ndarray, risk_free_rate: float = 0.02) -> float:
    """
    Calculate Sharpe ratio from prices.
    
    Args:
        prices: Price array
        risk_free_rate: Annual risk-free rate
        
    Returns:
        Sharpe ratio
    """
    returns = _prices_to_returns(prices)
    
    if len(returns) == 0:
        return 0.0
    
    # Annualized return and volatility
    annual_return = np.mean(returns) * 252
    annual_vol = np.std(returns) * np.sqrt(252)
    
    if annual_vol == 0:
        return 0.0
    
    return (annual_return - risk_free_rate) / annual_vol


def predict_confidence_interval(
    model: Pipeline,
    last_window_prices: np.ndarray,
    window: int = 30,
    confidence: float = 0.95
) -> tuple:
    """
    Predict price with confidence interval (simplified approach).
    
    Args:
        model: Trained model
        last_window_prices: Recent prices
        window: Window size
        confidence: Confidence level (0-1)
        
    Returns:
        (predicted_price, lower_bound, upper_bound)
    """
    predicted_price = predict_next_price(model, last_window_prices, window)
    
    # Simple volatility-based confidence interval
    returns = _prices_to_returns(last_window_prices)
    vol = np.std(returns)
    
    # Z-score for confidence level
    from scipy.stats import norm
    z_score = norm.ppf((1 + confidence) / 2)
    
    # Price bounds
    lower_bound = predicted_price * np.exp(-z_score * vol)
    upper_bound = predicted_price * np.exp(z_score * vol)
    
    return predicted_price, lower_bound, upper_bound


def backtest_model(
    prices: np.ndarray,
    window: int = 30,
    test_size: int = 30
) -> dict:
    """
    Simple backtest of the model.
    
    Args:
        prices: Historical prices
        window: Model window size
        test_size: Number of periods to test
        
    Returns:
        Dictionary with backtest results
    """
    if len(prices) < window + test_size + 10:
        raise ValueError("Insufficient data for backtesting")
    
    # Split data
    train_end = len(prices) - test_size
    train_prices = prices[:train_end]
    test_prices = prices[train_end - window:]  # Include window for predictions
    
    # Train model
    model = train_from_prices(train_prices, window)
    
    # Make predictions
    predictions = []
    actuals = []
    
    for i in range(test_size):
        # Get window for prediction
        pred_window = test_prices[i:i + window + 1]
        if len(pred_window) < window + 1:
            break
            
        # Predict next price
        pred_price = predict_next_price(model, pred_window, window)
        actual_price = test_prices[i + window + 1] if i + window + 1 < len(test_prices) else None
        
        if actual_price is not None:
            predictions.append(pred_price)
            actuals.append(actual_price)
    
    if not predictions:
        return {"error": "No valid predictions made"}
    
    # Calculate metrics
    predictions = np.array(predictions)
    actuals = np.array(actuals)
    
    mse = np.mean((predictions - actuals) ** 2)
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((predictions - actuals) / actuals)) * 100
    
    # Direction accuracy
    pred_direction = np.diff(predictions) > 0
    actual_direction = np.diff(actuals) > 0
    direction_accuracy = np.mean(pred_direction == actual_direction) if len(pred_direction) > 0 else 0
    
    return {
        "test_size": len(predictions),
        "mse": float(mse),
        "mae": float(mae),
        "mape": float(mape),
        "direction_accuracy": float(direction_accuracy),
        "predictions": predictions.tolist(),
        "actuals": actuals.tolist()
    }