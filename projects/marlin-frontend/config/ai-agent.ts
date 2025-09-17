// AI Agent Configuration
export const AI_AGENT_CONFIG = {
  baseUrl: process.env.AI_AGENT_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
}

// Real-time streaming configuration
export const STREAMING_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME !== 'false',
  heartbeatInterval: parseInt(process.env.NEXT_PUBLIC_SSE_HEARTBEAT_INTERVAL || '30000'),
  reconnectDelay: 5000,
  maxReconnectAttempts: 10,
}

// Automation configuration
export const AUTOMATION_CONFIG = {
  defaultInterval: parseInt(process.env.NEXT_PUBLIC_AUTOMATION_DEFAULT_INTERVAL || '60000'),
  priceChangeThreshold: 5, // 5% price change to trigger alerts
  trendThreshold: 0.1, // 10% trend threshold
}

// Algorand configuration
export const ALGORAND_CONFIG = {
  network: (process.env.NEXT_PUBLIC_ALGORAND_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'localnet',
  algodAddress: process.env.NEXT_PUBLIC_ALGOD_ADDRESS || 'https://testnet-api.algonode.cloud',
  algodToken: process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
}

// Contract App IDs
export const CONTRACT_APP_IDS = {
  yieldTokenization: process.env.NEXT_PUBLIC_YIELD_TOKENIZATION_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_YIELD_TOKENIZATION_APP_ID) : undefined,
  ptToken: process.env.NEXT_PUBLIC_PT_TOKEN_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_PT_TOKEN_APP_ID) : undefined,
  ytToken: process.env.NEXT_PUBLIC_YT_TOKEN_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_YT_TOKEN_APP_ID) : undefined,
  simpleAmm: process.env.NEXT_PUBLIC_SIMPLE_AMM_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_SIMPLE_AMM_APP_ID) : undefined,
  stakingDapp: process.env.NEXT_PUBLIC_STAKING_DAPP_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_STAKING_DAPP_APP_ID) : undefined,
  priceOracle: process.env.NEXT_PUBLIC_PRICE_ORACLE_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_PRICE_ORACLE_APP_ID) : undefined,
  standardizedWrapper: process.env.NEXT_PUBLIC_STANDARDIZED_WRAPPER_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_STANDARDIZED_WRAPPER_APP_ID) : undefined,
  ytAutoConverter: process.env.NEXT_PUBLIC_YT_AUTO_CONVERTER_APP_ID ? 
    parseInt(process.env.NEXT_PUBLIC_YT_AUTO_CONVERTER_APP_ID) : undefined,
}

// Debug and development
export const DEBUG_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  mockResponses: process.env.NEXT_PUBLIC_MOCK_AI_RESPONSES === 'true',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
}

// API endpoints
export const API_ENDPOINTS = {
  aiAgent: '/api/ai-agent',
  aiAgentStream: '/api/ai-agent/stream',
  algorandPools: '/api/algorandpools',
  algorandOptimization: '/api/algorandptytoptimization',
  algorandTokenDetails: '/api/algorandtokendetails',
  algorandTokenHistory: '/api/algorandtokenhistory',
}
