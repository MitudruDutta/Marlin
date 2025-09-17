export interface AlgorandLPRecommendationInputs {
  amountUsd: number;
  horizonMonths: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  topN?: number;
  project?: string;
  search?: string;
  chain?: string;
  includeNarrative?: boolean;
  // Algorand-specific fields
  minAppId?: number;
  maxAppId?: number;
  assetIds?: number[];
}

export interface AlgorandLPRecommendationPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  url: string | null;
  category: string | null;
  tvlUsd: number;
  apy_now: number;
  apy_net_estimate: number;
  periodReturnPct: number;
  downsidePeriod: number;
  RAR: number;
  Score: number;
  throughput: number;
  conf: number;
  amountStartUSD: number;
  amountEndUSD: number;
  profitUsd: number;
  horizonMonths: number;
  why: {
    tvlScore: number;
    ilPenaltyPctPts: number;
    exposureBias: number;
    style: string;
  };
  exposure: string;
  ilRisk: string;
  underlyingTokens: string[];
  topsisScore: number;
  tvlFloorApplied: number;
  // Algorand-specific fields
  appId?: number;
  assetIdA?: number;
  assetIdB?: number;
  globalState?: Record<string, any>;
  localState?: Record<string, any>;
}

export interface AlgorandLPRecommendationExplanation {
  pool: string;
  project: string;
  symbol: string;
  text: string;
  appId?: number;
}

export interface AlgorandLPRecommendationResponse {
  inputs: AlgorandLPRecommendationInputs & {
    chain: string;
    limitFetch: number;
    includeNarrative: boolean;
  };
  universeCount: number;
  tvlFloorUsed: number;
  topN: AlgorandLPRecommendationPool[];
  explanations: AlgorandLPRecommendationExplanation[];
}

const API_BASE_URL = 'https://fastapi-on-render-0s0u.onrender.com';

export const getAlgorandLPRecommendations = async (
  inputs: AlgorandLPRecommendationInputs
): Promise<AlgorandLPRecommendationResponse> => {
  const params = new URLSearchParams({
    amountUsd: inputs.amountUsd.toString(),
    horizonMonths: inputs.horizonMonths.toString(),
    riskTolerance: inputs.riskTolerance,
    chain: inputs.chain || 'algorand',
    ...(inputs.topN && { topN: inputs.topN.toString() }),
    ...(inputs.project && { project: inputs.project }),
    ...(inputs.search && { search: inputs.search }),
    ...(inputs.includeNarrative && { includeNarrative: inputs.includeNarrative.toString() }),
    ...(inputs.minAppId && { minAppId: inputs.minAppId.toString() }),
    ...(inputs.maxAppId && { maxAppId: inputs.maxAppId.toString() }),
    ...(inputs.assetIds && { assetIds: inputs.assetIds.join(',') }),
  });

  const response = await fetch(`${API_BASE_URL}/recommend?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Algorand LP recommendations: ${response.statusText}`);
  }

  return response.json();
};

export const getAlgorandLPRecommendationsLocal = async (
  inputs: AlgorandLPRecommendationInputs,
  localPort: number = 9000
): Promise<AlgorandLPRecommendationResponse> => {
  const params = new URLSearchParams({
    amountUsd: inputs.amountUsd.toString(),
    horizonMonths: inputs.horizonMonths.toString(),
    riskTolerance: inputs.riskTolerance,
    chain: inputs.chain || 'algorand',
    ...(inputs.topN && { topN: inputs.topN.toString() }),
    ...(inputs.project && { project: inputs.project }),
    ...(inputs.search && { search: inputs.search }),
    ...(inputs.includeNarrative && { includeNarrative: inputs.includeNarrative.toString() }),
    ...(inputs.minAppId && { minAppId: inputs.minAppId.toString() }),
    ...(inputs.maxAppId && { maxAppId: inputs.maxAppId.toString() }),
    ...(inputs.assetIds && { assetIds: inputs.assetIds.join(',') }),
  });

  const response = await fetch(`http://localhost:${localPort}/recommend?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Algorand LP recommendations: ${response.statusText}`);
  }

  return response.json();
};

// Mock data for development
export const getMockAlgorandLPRecommendations = async (
  inputs: AlgorandLPRecommendationInputs
): Promise<AlgorandLPRecommendationResponse> => {
  const mockPools: AlgorandLPRecommendationPool[] = [
    {
      pool: 'algo-usdc-v1',
      project: 'Marlin AMM',
      chain: 'algorand',
      symbol: 'ALGO-USDC',
      url: null,
      category: 'DEX',
      tvlUsd: 1500000,
      apy_now: 8.5,
      apy_net_estimate: 8.2,
      periodReturnPct: 4.1,
      downsidePeriod: 0.05,
      RAR: 82.0,
      Score: 92.5,
      throughput: 125000,
      conf: 0.95,
      amountStartUSD: inputs.amountUsd,
      amountEndUSD: inputs.amountUsd * 1.041,
      profitUsd: inputs.amountUsd * 0.041,
      horizonMonths: inputs.horizonMonths,
      why: {
        tvlScore: 95,
        ilPenaltyPctPts: -0.3,
        exposureBias: 0.1,
        style: 'stable'
      },
      exposure: 'stable',
      ilRisk: 'low',
      underlyingTokens: ['ALGO', 'USDC'],
      topsisScore: 0.925,
      tvlFloorApplied: 1000000,
      appId: 123456789,
      assetIdA: 0,
      assetIdB: 31566704
    },
    {
      pool: 'algo-usdt-v1',
      project: 'Marlin AMM',
      chain: 'algorand',
      symbol: 'ALGO-USDT',
      url: null,
      category: 'DEX',
      tvlUsd: 890000,
      apy_now: 7.2,
      apy_net_estimate: 6.9,
      periodReturnPct: 3.6,
      downsidePeriod: 0.08,
      RAR: 75.0,
      Score: 88.2,
      throughput: 85000,
      conf: 0.92,
      amountStartUSD: inputs.amountUsd,
      amountEndUSD: inputs.amountUsd * 1.036,
      profitUsd: inputs.amountUsd * 0.036,
      horizonMonths: inputs.horizonMonths,
      why: {
        tvlScore: 88,
        ilPenaltyPctPts: -0.3,
        exposureBias: 0.1,
        style: 'stable'
      },
      exposure: 'stable',
      ilRisk: 'low',
      underlyingTokens: ['ALGO', 'USDT'],
      topsisScore: 0.882,
      tvlFloorApplied: 1000000,
      appId: 123456790,
      assetIdA: 0,
      assetIdB: 312769
    }
  ];

  const filteredPools = inputs.riskTolerance === 'conservative' 
    ? mockPools.filter(p => p.ilRisk === 'low')
    : mockPools;

  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    inputs: {
      ...inputs,
      chain: 'algorand',
      limitFetch: 100,
      includeNarrative: inputs.includeNarrative || false
    },
    universeCount: 25,
    tvlFloorUsed: 1000000,
    topN: filteredPools.slice(0, inputs.topN || 5),
    explanations: filteredPools.map(pool => ({
      pool: pool.pool,
      project: pool.project,
      symbol: pool.symbol,
      text: `${pool.symbol} offers ${pool.apy_now}% APY with ${pool.ilRisk} impermanent loss risk. Expected profit: $${pool.profitUsd.toFixed(2)} over ${inputs.horizonMonths} months.`,
      appId: pool.appId
    }))
  };
}; 