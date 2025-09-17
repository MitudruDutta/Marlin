// Algorand API exports
export * from './algorandpools';
export * from './algorandlprecommendations';
export * from './algorandptytoptimization';
export * from './algorandtokendetails';
export * from './algorandtokenhistory';
export * from './algorandtokenperformance';

// Re-export common types with Algorand prefix for clarity
export type {
  AlgorandPool,
  AlgorandPoolsResponse
} from './algorandpools';

export type {
  AlgorandLPRecommendationInputs,
  AlgorandLPRecommendationPool,
  AlgorandLPRecommendationResponse,
  AlgorandLPRecommendationExplanation
} from './algorandlprecommendations';

export type {
  AlgorandPTYTOptimizationInputs,
  AlgorandPTYTOptimizationResponse,
  PTYTSplit,
  PTYTPrediction
} from './algorandptytoptimization';

export type {
  AlgorandAssetDetails
} from './algorandtokendetails';

// Default exports for commonly used functions
export {
  getAlgorandPools,
  getMockAlgorandPools
} from './algorandpools';

export {
  getAlgorandLPRecommendations,
  getMockAlgorandLPRecommendations
} from './algorandlprecommendations';

export {
  getAlgorandPTYTOptimization,
  getMockAlgorandPTYTOptimization
} from './algorandptytoptimization';

export {
  getAlgorandAssetDetails,
  getMockAlgorandAssetDetails
} from './algorandtokendetails';