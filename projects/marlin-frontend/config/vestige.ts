// Vestige Labs API Configuration
export const VESTIGE_CONFIG = {
  // API Base URL
  baseUrl: process.env.NEXT_PUBLIC_VESTIGE_API_URL || 'https://api.vestigelabs.org',
  
  // API Key
  apiKey: process.env.NEXT_PUBLIC_VESTIGE_API_KEY || '',
  
  // Request configuration
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  
  // Cache configuration
  defaultStaleTime: 2 * 60 * 1000, // 2 minutes
  priceStaleTime: 30 * 1000, // 30 seconds
  volumeStaleTime: 1 * 60 * 1000, // 1 minute
  
  // Refetch intervals
  priceRefetchInterval: 30 * 1000, // 30 seconds
  balanceRefetchInterval: 30 * 1000, // 30 seconds
  walletValueRefetchInterval: 30 * 1000, // 30 seconds
  
  // Rate limiting
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
};

// Environment validation
export const validateVestigeConfig = () => {
  const warnings: string[] = [];
  
  if (!VESTIGE_CONFIG.apiKey) {
    warnings.push('VESTIGE_API_KEY is not set. Some API endpoints may be rate-limited.');
  }
  
  if (warnings.length > 0) {
    console.warn('Vestige Labs API Configuration Warnings:', warnings);
  }
  
  return {
    isValid: true,
    warnings,
  };
};

// Helper function to get API key with fallback
export const getVestigeApiKey = (): string => {
  return VESTIGE_CONFIG.apiKey;
};

// Helper function to check if API key is configured
export const hasVestigeApiKey = (): boolean => {
  return !!VESTIGE_CONFIG.apiKey;
};
