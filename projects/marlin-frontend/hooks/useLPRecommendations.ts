import { useState } from 'react';
import { getLPRecommendations } from '../api';
import type { 
  LPRecommendationInputs, 
  LPRecommendationResponse,
  LPRecommendationPool 
} from '../api';

export const useLPRecommendations = () => {
  const [recommendations, setRecommendations] = useState<LPRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (inputs: LPRecommendationInputs) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLPRecommendations(inputs);
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getTopRecommendations = (count: number = 2): LPRecommendationPool[] => {
    if (!recommendations?.topN) return [];
    return recommendations.topN.slice(0, count);
  };

  const getRecommendationById = (poolId: string): LPRecommendationPool | undefined => {
    if (!recommendations?.topN) return undefined;
    return recommendations.topN.find(pool => pool.pool === poolId);
  };

  const getExplanationByPoolId = (poolId: string): string | undefined => {
    if (!recommendations?.explanations) return undefined;
    const explanation = recommendations.explanations.find(exp => exp.pool === poolId);
    return explanation?.text;
  };

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    getTopRecommendations,
    getRecommendationById,
    getExplanationByPoolId,
  };
}; 