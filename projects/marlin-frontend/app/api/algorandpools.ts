export interface AlgorandPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  poolMeta: string | null;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[] | null;
  il7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyBaseInception: number | null;
  // Algorand-specific fields
  appId?: number;
  assetIdA?: number;
  assetIdB?: number;
  reserves?: {
    assetA: bigint;
    assetB: bigint;
  };
}

export interface AlgorandPoolsResponse {
  count: number;
  results: AlgorandPool[];
}

const API_BASE_URL = 'https://fastapi-on-render-0s0u.onrender.com';

export const getAlgorandPools = async (
  limit: number = 5
): Promise<AlgorandPoolsResponse> => {
  const response = await fetch(`${API_BASE_URL}/llama/pools?chain=algorand&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Algorand pools: ${response.statusText}`);
  }

  return response.json();
};

export const getAlgorandPoolsLocal = async (
  limit: number = 5,
  localPort: number = 8000
): Promise<AlgorandPoolsResponse> => {
  const response = await fetch(`http://localhost:${localPort}/llama/pools?chain=algorand&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Algorand pools: ${response.statusText}`);
  }

  return response.json();
};

// Mock data for development when API is not available
export const getMockAlgorandPools = async (
  limit: number = 5
): Promise<AlgorandPoolsResponse> => {
  const mockPools: AlgorandPool[] = [
    {
      chain: 'algorand',
      project: 'Marlin AMM',
      symbol: 'ALGO-USDC',
      tvlUsd: 1500000,
      apyBase: 6.5,
      apyReward: 2.0,
      apy: 8.5,
      rewardTokens: ['MARLIN'],
      pool: 'algo-usdc-v1',
      apyPct1D: 0.1,
      apyPct7D: 0.8,
      apyPct30D: 2.1,
      stablecoin: true,
      ilRisk: 'low',
      exposure: 'stable',
      predictions: {
        predictedClass: 'stable',
        predictedProbability: 0.92,
        binnedConfidence: 5
      },
      poolMeta: 'algo_usdc_pool',
      mu: 8.2,
      sigma: 1.1,
      count: 150,
      outlier: false,
      underlyingTokens: ['ALGO', 'USDC'],
      il7d: 0.02,
      apyBase7d: 6.8,
      apyMean30d: 8.1,
      volumeUsd1d: 125000,
      volumeUsd7d: 890000,
      apyBaseInception: 7.2,
      appId: 123456789,
      assetIdA: 0, // ALGO
      assetIdB: 31566704, // USDC
      reserves: {
        assetA: BigInt('1500000000000'), // 1.5M ALGO
        assetB: BigInt('1500000000000')  // 1.5M USDC
      }
    },
    {
      chain: 'algorand',
      project: 'Marlin AMM',
      symbol: 'ALGO-USDT',
      tvlUsd: 890000,
      apyBase: 5.2,
      apyReward: 2.0,
      apy: 7.2,
      rewardTokens: ['MARLIN'],
      pool: 'algo-usdt-v1',
      apyPct1D: 0.05,
      apyPct7D: 0.6,
      apyPct30D: 1.8,
      stablecoin: true,
      ilRisk: 'low',
      exposure: 'stable',
      predictions: {
        predictedClass: 'stable',
        predictedProbability: 0.89,
        binnedConfidence: 4
      },
      poolMeta: 'algo_usdt_pool',
      mu: 7.1,
      sigma: 1.3,
      count: 120,
      outlier: false,
      underlyingTokens: ['ALGO', 'USDT'],
      il7d: 0.03,
      apyBase7d: 5.5,
      apyMean30d: 7.0,
      volumeUsd1d: 85000,
      volumeUsd7d: 620000,
      apyBaseInception: 6.8,
      appId: 123456790,
      assetIdA: 0, // ALGO
      assetIdB: 312769, // USDT
      reserves: {
        assetA: BigInt('890000000000'),
        assetB: BigInt('890000000000')
      }
    },
    {
      chain: 'algorand',
      project: 'Marlin AMM',
      symbol: 'ALGO-WBTC',
      tvlUsd: 650000,
      apyBase: 10.8,
      apyReward: 2.0,
      apy: 12.8,
      rewardTokens: ['MARLIN'],
      pool: 'algo-wbtc-v1',
      apyPct1D: 0.2,
      apyPct7D: 1.5,
      apyPct30D: 4.2,
      stablecoin: false,
      ilRisk: 'high',
      exposure: 'volatile',
      predictions: {
        predictedClass: 'volatile',
        predictedProbability: 0.78,
        binnedConfidence: 3
      },
      poolMeta: 'algo_wbtc_pool',
      mu: 12.5,
      sigma: 3.2,
      count: 80,
      outlier: false,
      underlyingTokens: ['ALGO', 'WBTC'],
      il7d: 2.1,
      apyBase7d: 11.2,
      apyMean30d: 12.3,
      volumeUsd1d: 95000,
      volumeUsd7d: 580000,
      apyBaseInception: 11.8,
      appId: 123456791,
      assetIdA: 0, // ALGO
      assetIdB: 67396430, // WBTC
      reserves: {
        assetA: BigInt('650000000000'),
        assetB: BigInt('15000000') // 0.15 WBTC
      }
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    count: mockPools.length,
    results: mockPools.slice(0, limit)
  };
};
