import { useState } from 'react';
import { getPTYTOptimization } from '../api';
import type {
  PTYTOptimizationInputs,
  PTYTOptimizationResponse
} from '../api';

export const usePTYTOptimization = () => {
  const [optimization, setOptimization] = useState<PTYTOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimization = async (inputs: PTYTOptimizationInputs) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPTYTOptimization(inputs);
      setOptimization(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get PT/YT optimization';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOptimization(null);
    setError(null);
    setLoading(false);
  };

  const getSplitPercentages = () => {
    if (!optimization) return null;
    
    return {
      PT: Math.round(optimization.recommended_split.PT * 100),
      YT: Math.round(optimization.recommended_split.YT * 100)
    };
  };

  const getPriceChange = () => {
    if (!optimization) return null;
    
    const { last_price, predicted_next_price } = optimization.prediction;
    const change = ((predicted_next_price - last_price) / last_price) * 100;
    
    return {
      current: last_price,
      predicted: predicted_next_price,
      changePercent: change,
      isPositive: change > 0
    };
  };

  return {
    optimization,
    loading,
    error,
    fetchOptimization,
    reset,
    getSplitPercentages,
    getPriceChange
  };
};