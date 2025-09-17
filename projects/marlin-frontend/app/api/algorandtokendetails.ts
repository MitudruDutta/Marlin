// src/api/algorandtokens.ts
export interface AlgorandAssetDetails {
  assetId: number;
  symbol: string;
  name: string;
  unitName: string;
  decimals: number;
  totalSupply: bigint;
  circulatingSupply?: bigint;
  creator: string;
  manager?: string;
  reserve?: string;
  freeze?: string;
  clawback?: string;
  url?: string;
  metadataHash?: string;
  defaultFrozen: boolean;
  current_price?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  high_24h?: number;
  low_24h?: number;
  last_updated?: string;
}

export async function getAlgorandAssetDetails(assetId: number): Promise<AlgorandAssetDetails | null> {
  try {
    const res = await fetch(`http://localhost:8000/algorand/assets/${assetId}`);
    if (!res.ok) {
      throw new Error("Asset not found");
    }

    const data = await res.json();

    return {
      assetId: data.asset_id || assetId,
      symbol: data.symbol || data.unit_name || `ASA-${assetId}`,
      name: data.name || `Algorand Standard Asset ${assetId}`,
      unitName: data.unit_name || data.symbol || `ASA${assetId}`,
      decimals: data.decimals || 0,
      totalSupply: BigInt(data.total_supply || 0),
      circulatingSupply: data.circulating_supply ? BigInt(data.circulating_supply) : undefined,
      creator: data.creator,
      manager: data.manager,
      reserve: data.reserve,
      freeze: data.freeze,
      clawback: data.clawback,
      url: data.url,
      metadataHash: data.metadata_hash,
      defaultFrozen: data.default_frozen || false,
      current_price: data.current_price,
      market_cap: data.market_cap,
      volume_24h: data.volume_24h,
      price_change_24h: data.price_change_24h,
      price_change_percentage_24h: data.price_change_percentage_24h,
      high_24h: data.high_24h,
      low_24h: data.low_24h,
      last_updated: data.last_updated,
    };
  } catch (err: any) {
    console.error("Error fetching Algorand asset details:", err.message || err);
    return null;
  }
}

// Mock data for development
export async function getMockAlgorandAssetDetails(assetId: number): Promise<AlgorandAssetDetails | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockAssets: Record<number, AlgorandAssetDetails> = {
    0: { // ALGO
      assetId: 0,
      symbol: 'ALGO',
      name: 'Algorand',
      unitName: 'ALGO',
      decimals: 6,
      totalSupply: BigInt('10000000000000000'), // 10B ALGO
      circulatingSupply: BigInt('7000000000000000'), // 7B ALGO
      creator: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      defaultFrozen: false,
      current_price: 0.25,
      market_cap: 1750000000,
      volume_24h: 45000000,
      price_change_24h: 0.02,
      price_change_percentage_24h: 8.7,
      high_24h: 0.26,
      low_24h: 0.23,
      last_updated: new Date().toISOString()
    },
    31566704: { // USDC
      assetId: 31566704,
      symbol: 'USDC',
      name: 'USD Coin',
      unitName: 'USDC',
      decimals: 6,
      totalSupply: BigInt('1000000000000000'), // 1B USDC
      circulatingSupply: BigInt('900000000000000'), // 900M USDC
      creator: 'Q2SLSYA26KHKBUUIN7WAWPKCHSHM3ALNFS2QHZL2J43ZLNWZ3FVAD3SW34',
      defaultFrozen: false,
      current_price: 1.00,
      market_cap: 900000000,
      volume_24h: 25000000,
      price_change_24h: 0.001,
      price_change_percentage_24h: 0.1,
      high_24h: 1.001,
      low_24h: 0.999,
      last_updated: new Date().toISOString()
    },
    312769: { // USDT
      assetId: 312769,
      symbol: 'USDT',
      name: 'Tether USD',
      unitName: 'USDT',
      decimals: 6,
      totalSupply: BigInt('800000000000000'), // 800M USDT
      circulatingSupply: BigInt('750000000000000'), // 750M USDT
      creator: 'Q2SLSYA26KHKBUUIN7WAWPKCHSHM3ALNFS2QHZL2J43ZLNWZ3FVAD3SW34',
      defaultFrozen: false,
      current_price: 1.00,
      market_cap: 750000000,
      volume_24h: 18000000,
      price_change_24h: -0.001,
      price_change_percentage_24h: -0.1,
      high_24h: 1.001,
      low_24h: 0.998,
      last_updated: new Date().toISOString()
    }
  };

  return mockAssets[assetId] || null;
}
