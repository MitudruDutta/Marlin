import { useState, useEffect, useCallback, useRef } from 'react';

interface AIAgentHealth {
  ok: boolean;
  model_ready: boolean;
  algorand_ready: boolean;
  window: number;
  price_source: string;
  network: string;
  startup_error?: string;
  last_error?: string;
  last_error_age_sec?: number;
  skip_model_train: boolean;
}

interface OptimizationData {
  coin_id: string;
  risk_profile: string;
  maturity_months: number;
  recommended_split: {
    PT: number;
    YT: number;
  };
  prediction: {
    window: number;
    last_price: number;
    predicted_next_price: number;
    trend_estimate: number;
    target: string;
  };
  contract_recommendations?: any;
  notes: any;
}

interface ContractStatus {
  network: string;
  contracts: Record<string, any>;
  total_contracts: number;
  connected_contracts: number;
}

interface CoinData {
  id: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  source: string;
}

interface StreamData {
  timestamp: string;
  health: AIAgentHealth | null;
  contracts: ContractStatus | null;
  optimization?: OptimizationData | null;
  coin_data?: CoinData | null;
  error?: string;
}

export function useAIAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<AIAgentHealth | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [latestOptimization, setLatestOptimization] = useState<OptimizationData | null>(null);
  const [latestCoinData, setLatestCoinData] = useState<CoinData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 10;

  // Manual API calls
  const callAIAgent = useCallback(async (action: string, params: any = {}) => {
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }

      return result.data;
    } catch (error) {
      console.error('AI Agent API call error:', error);
      throw error;
    }
  }, []);

  // Get optimization recommendation
  const getOptimization = useCallback(async (params: {
    coin_id?: string;
    risk_profile?: 'conservative' | 'moderate' | 'aggressive';
    maturity_months?: 3 | 6 | 9 | 12;
    amount_algo?: number;
  }) => {
    return callAIAgent('optimize', params);
  }, [callAIAgent]);

  // Get coin data
  const getCoinData = useCallback(async (coin_id: string = 'algorand') => {
    return callAIAgent('coin_data', { coin_id });
  }, [callAIAgent]);

  // Get contract status
  const getContractStatus = useCallback(async () => {
    return callAIAgent('contract_status');
  }, [callAIAgent]);

  // Interact with contracts
  const interactWithContract = useCallback(async (params: {
    contract_action: string;
    amount?: number;
    maturity_timestamp?: number;
    user_address?: string;
  }) => {
    return callAIAgent('contract_interact', params);
  }, [callAIAgent]);

  // SSE connection management
  const connectEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/ai-agent/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('AI Agent stream connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        setIsLoading(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StreamData = JSON.parse(event.data);
          
          if (data.error) {
            setError(data.error);
          } else {
            setError(null);
            setLastUpdate(data.timestamp);
            
            if (data.health) {
              setHealth(data.health);
            }
            
            if (data.contracts) {
              setContractStatus(data.contracts);
            }
            
            if (data.optimization) {
              setLatestOptimization(data.optimization);
            }
            
            if (data.coin_data) {
              setLatestCoinData(data.coin_data);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse SSE data:', parseError);
          setError('Failed to parse real-time data');
        }
      };

      eventSource.onerror = (event) => {
        console.error('AI Agent stream error:', event);
        setIsConnected(false);
        setError('Real-time connection lost');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectEventSource();
          }, delay);
        } else {
          setError('Maximum reconnection attempts reached');
          setIsLoading(false);
        }
      };

      eventSource.addEventListener('heartbeat', (event) => {
        // Handle heartbeat to keep connection alive
        console.log('AI Agent heartbeat received');
      });

    } catch (connectionError) {
      console.error('Failed to establish SSE connection:', connectionError);
      setError('Failed to establish real-time connection');
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [reconnectAttempts]);

  // Initialize connection
  useEffect(() => {
    connectEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectEventSource]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    setIsLoading(true);
    connectEventSource();
  }, [connectEventSource]);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    lastUpdate,
    reconnectAttempts,
    
    // Data
    health,
    contractStatus,
    latestOptimization,
    latestCoinData,
    
    // Actions
    getOptimization,
    getCoinData,
    getContractStatus,
    interactWithContract,
    reconnect,
    
    // Helper computed values
    isHealthy: health?.ok && health?.model_ready && health?.algorand_ready,
    isModelReady: health?.model_ready || false,
    isAlgorandReady: health?.algorand_ready || false,
    connectedContracts: contractStatus?.connected_contracts || 0,
    totalContracts: contractStatus?.total_contracts || 0,
  };
}
