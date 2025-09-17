import { useState, useEffect } from 'react';
import { useWallet } from '../components/WalletProvider';
import { useAlgorandPools, type AlgorandPoolsResponse, type AlgorandPool } from './useAlgorandPools';
import { AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client';

// Types for Algorand LP recommendations
export interface AlgorandLPRecommendation {
  pool: string;
  tokenA: string;
  tokenB: string;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  tvl: number;
  volume24h: number;
  impermanentLoss: number;
  recommendation: string;
}

export interface AlgorandLPRecommendationInputs {
  amountUsd: number;
  horizonMonths: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  topN: number;
  chain: 'algorand';
  includeNarrative: boolean;
}

export interface AlgorandLPRecommendationResponse {
  topN: AlgorandLPRecommendation[];
  explanations: Array<{
    pool: string;
    explanation: string;
    reasoning: string;
  }>;
}

export interface AlgorandTradingData {
  recommendations: AlgorandLPRecommendationResponse | null;
  pools: AlgorandPoolsResponse | null;
  loading: boolean;
  error: string | null;
  isLiveData: boolean;
}

export const useAlgorandTrading = () => {
  const { activeAddress } = useWallet();
  const { pools: availablePools } = useAlgorandPools(10);
  
  const [data, setData] = useState<AlgorandTradingData>({
    recommendations: null,
    pools: null,
    loading: false,
    error: null,
    isLiveData: false
  });

  const fetchTradingData = async (
    amountUsd: number = 500, 
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ) => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (!activeAddress) {
        throw new Error('Wallet not connected');
      }

      // Create Algorand client
      const client = AlgorandClient.testNet();

      // Generate mock recommendations based on available pools
      const mockRecommendations: AlgorandLPRecommendation[] = availablePools.map(pool => ({
        pool: pool.id,
        tokenA: pool.tokenA,
        tokenB: pool.tokenB,
        apy: pool.apy,
        risk: pool.apy > 10 ? 'high' : pool.apy > 6 ? 'medium' : 'low',
        tvl: pool.tvlUsd,
        volume24h: pool.volume24h,
        impermanentLoss: pool.stablecoin ? 0.5 : 3.2,
        recommendation: generateRecommendation(pool, riskTolerance)
      }));

      const recommendations: AlgorandLPRecommendationResponse = {
        topN: mockRecommendations
          .filter(rec => filterByRiskTolerance(rec, riskTolerance))
          .sort((a, b) => b.apy - a.apy)
          .slice(0, 5),
        explanations: mockRecommendations.map(rec => ({
          pool: rec.pool,
          explanation: `${rec.tokenA}/${rec.tokenB} pair offers ${rec.apy}% APY with ${rec.risk} risk profile`,
          reasoning: `Based on TVL of $${rec.tvl.toLocaleString()} and 24h volume of $${rec.volume24h.toLocaleString()}`
        }))
      };

      const poolsResponse: AlgorandPoolsResponse = {
        results: availablePools,
        total: availablePools.length
      };

      setData({
        recommendations,
        pools: poolsResponse,
        loading: false,
        error: null,
        isLiveData: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Algorand trading data';
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const generateRecommendation = (pool: AlgorandPool, riskTolerance: string): string => {
    if (riskTolerance === 'conservative' && pool.stablecoin) {
      return 'Recommended for conservative investors due to stablecoin pairing';
    } else if (riskTolerance === 'aggressive' && !pool.stablecoin) {
      return 'High yield opportunity for aggressive investors';
    } else if (riskTolerance === 'moderate') {
      return 'Balanced risk-reward ratio suitable for moderate investors';
    }
    return 'Consider your risk tolerance before investing';
  };

  const filterByRiskTolerance = (rec: AlgorandLPRecommendation, tolerance: string): boolean => {
    switch (tolerance) {
      case 'conservative':
        return rec.risk === 'low' || rec.risk === 'medium';
      case 'moderate':
        return rec.risk === 'medium' || rec.risk === 'high';
      case 'aggressive':
        return true;
      default:
        return true;
    }
  };

  const getTopRecommendations = (count: number = 5) => {
    if (!data.recommendations?.topN) return [];
    return data.recommendations.topN.slice(0, count);
  };

  const getTopPools = (count: number = 10) => {
    if (!data.pools?.results) return [];
    return data.pools.results.slice(0, count);
  };

  const getRecommendationById = (poolId: string) => {
    if (!data.recommendations?.topN) {
      return null;
    }
    return data.recommendations.topN.find(pool => pool.pool === poolId);
  };

  const getPoolById = (poolId: string) => {
    if (!data.pools?.results) return null;
    return data.pools.results.find(pool => pool.id === poolId);
  };

  const getExplanationByPoolId = (poolId: string) => {
    if (!data.recommendations?.explanations) return null;
    return data.recommendations.explanations.find(exp => exp.pool === poolId);
  };

  return {
    ...data,
    fetchTradingData,
    getTopRecommendations,
    getTopPools,
    getRecommendationById,
    getPoolById,
    getExplanationByPoolId
  };
};
