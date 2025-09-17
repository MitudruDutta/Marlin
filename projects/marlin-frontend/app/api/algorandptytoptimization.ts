export interface AlgorandPTYTOptimizationInputs {
  asset_id: number; // Algorand Asset ID instead of coin_id
  risk_profile?: 'conservative' | 'aggressive';
  app_id?: number; // Optional Algorand app ID for the tokenization contract
}

export interface PTYTSplit {
  PT: number;
  YT: number;
}

export interface PTYTPrediction {
  window: number;
  last_price: number;
  predicted_next_price: number;
}

export interface AlgorandPTYTOptimizationResponse {
  asset_id: number;
  risk_profile: string;
  recommended_split: PTYTSplit;
  prediction: PTYTPrediction;
  app_id?: number;
  pt_asset_id?: number;
  yt_asset_id?: number;
}

const API_BASE_URL = 'https://fastapi-on-render-0s0u.onrender.com';

export const getAlgorandPTYTOptimization = async (
  inputs: AlgorandPTYTOptimizationInputs
): Promise<AlgorandPTYTOptimizationResponse> => {
  const requestBody = {
    asset_id: inputs.asset_id,
    ...(inputs.risk_profile && { risk_profile: inputs.risk_profile }),
    ...(inputs.app_id && { app_id: inputs.app_id })
  };

  const response = await fetch(`${API_BASE_URL}/algorand/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Model not initialized. Please try again in a moment.');
    } else if (response.status === 422) {
      throw new Error('Insufficient historical data to make a prediction.');
    } else if (response.status === 500) {
      throw new Error('Internal prediction error. Please try again.');
    } else {
      throw new Error(`Failed to get Algorand PT/YT optimization: ${response.statusText}`);
    }
  }

  return response.json();
};

export const getAlgorandPTYTOptimizationLocal = async (
  inputs: AlgorandPTYTOptimizationInputs,
  localPort: number = 8000
): Promise<AlgorandPTYTOptimizationResponse> => {
  const requestBody = {
    asset_id: inputs.asset_id,
    ...(inputs.risk_profile && { risk_profile: inputs.risk_profile }),
    ...(inputs.app_id && { app_id: inputs.app_id })
  };

  const response = await fetch(`http://localhost:${localPort}/algorand/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Model not initialized. Please try again in a moment.');
    } else if (response.status === 422) {
      throw new Error('Insufficient historical data to make a prediction.');
    } else if (response.status === 500) {
      throw new Error('Internal prediction error. Please try again.');
    } else {
      throw new Error(`Failed to get Algorand PT/YT optimization: ${response.statusText}`);
    }
  }

  return response.json();
};

// Mock data for development
export const getMockAlgorandPTYTOptimization = async (
  inputs: AlgorandPTYTOptimizationInputs
): Promise<AlgorandPTYTOptimizationResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const isConservative = inputs.risk_profile === 'conservative';
  
  return {
    asset_id: inputs.asset_id,
    risk_profile: inputs.risk_profile || 'moderate',
    recommended_split: {
      PT: isConservative ? 70 : 60, // Conservative: more PT (principal protection)
      YT: isConservative ? 30 : 40  // Aggressive: more YT (yield exposure)
    },
    prediction: {
      window: 30, // 30 days
      last_price: 1.85, // Last known price in USD
      predicted_next_price: isConservative ? 1.92 : 2.15 // Conservative vs aggressive prediction
    },
    app_id: inputs.app_id || 123456789,
    pt_asset_id: 555555555,
    yt_asset_id: 666666666
  };
};