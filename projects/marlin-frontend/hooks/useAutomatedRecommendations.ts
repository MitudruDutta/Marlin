import { useState, useEffect, useCallback } from 'react';
import { useAIAgent } from './useAIAgent';

interface AutomationConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  maturityMonths: 3 | 6 | 9 | 12;
  minInvestmentAmount: number;
  maxInvestmentAmount: number;
  priceChangeThreshold: number; // percentage change to trigger rebalancing
  alertsEnabled: boolean;
}

interface RecommendationAlert {
  id: string;
  timestamp: string;
  type: 'rebalance' | 'opportunity' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation?: any;
  priceChange?: number;
  action?: string;
}

const defaultConfig: AutomationConfig = {
  enabled: false,
  interval: 60000, // 1 minute
  riskProfile: 'moderate',
  maturityMonths: 6,
  minInvestmentAmount: 100,
  maxInvestmentAmount: 10000,
  priceChangeThreshold: 5, // 5% price change
  alertsEnabled: true,
};

export function useAutomatedRecommendations() {
  const [config, setConfig] = useState<AutomationConfig>(defaultConfig);
  const [alerts, setAlerts] = useState<RecommendationAlert[]>([]);
  const [lastPriceCheck, setLastPriceCheck] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [totalRecommendations, setTotalRecommendations] = useState(0);
  const [successfulRecommendations, setSuccessfulRecommendations] = useState(0);

  const {
    isHealthy,
    latestCoinData,
    latestOptimization,
    getOptimization,
    getCoinData,
  } = useAIAgent();

  // Add new alert
  const addAlert = useCallback((alert: Omit<RecommendationAlert, 'id' | 'timestamp'>) => {
    const newAlert: RecommendationAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep only last 50 alerts
    return newAlert;
  }, []);

  // Check for price-based triggers
  const checkPriceTriggers = useCallback(async () => {
    if (!config.enabled || !isHealthy || !latestCoinData) return;

    const currentPrice = latestCoinData.current_price;
    
    if (lastPriceCheck !== null) {
      const priceChange = ((currentPrice - lastPriceCheck) / lastPriceCheck) * 100;
      
      if (Math.abs(priceChange) >= config.priceChangeThreshold) {
        try {
          setTotalRecommendations(prev => prev + 1);
          
          // Get new optimization recommendation
          const recommendation = await getOptimization({
            coin_id: 'algorand',
            risk_profile: config.riskProfile,
            maturity_months: config.maturityMonths,
            amount_algo: config.minInvestmentAmount
          });

          setSuccessfulRecommendations(prev => prev + 1);

          addAlert({
            type: priceChange > 0 ? 'opportunity' : 'warning',
            title: `Significant Price Movement Detected`,
            message: `ALGO price ${priceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)}%. New optimization generated.`,
            recommendation,
            priceChange,
            action: 'reoptimize'
          });

        } catch (error) {
          addAlert({
            type: 'warning',
            title: 'Automation Error',
            message: `Failed to generate recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`,
            priceChange,
          });
        }
      }
    }
    
    setLastPriceCheck(currentPrice);
  }, [
    config.enabled,
    config.priceChangeThreshold,
    config.riskProfile,
    config.maturityMonths,
    config.minInvestmentAmount,
    isHealthy,
    latestCoinData,
    lastPriceCheck,
    getOptimization,
    addAlert
  ]);

  // Periodic recommendation generation
  const generatePeriodicRecommendation = useCallback(async () => {
    if (!config.enabled || !isHealthy) return;

    try {
      setTotalRecommendations(prev => prev + 1);
      
      const recommendation = await getOptimization({
        coin_id: 'algorand',
        risk_profile: config.riskProfile,
        maturity_months: config.maturityMonths,
        amount_algo: config.minInvestmentAmount
      });

      setSuccessfulRecommendations(prev => prev + 1);

      if (config.alertsEnabled) {
        addAlert({
          type: 'info',
          title: 'Periodic Optimization Update',
          message: `New AI recommendation generated for ${config.riskProfile} risk profile.`,
          recommendation,
          action: 'review'
        });
      }

    } catch (error) {
      addAlert({
        type: 'warning',
        title: 'Periodic Update Failed',
        message: `Failed to generate periodic recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [
    config.enabled,
    config.riskProfile,
    config.maturityMonths,
    config.minInvestmentAmount,
    config.alertsEnabled,
    isHealthy,
    getOptimization,
    addAlert
  ]);

  // Monitor for market conditions
  const checkMarketConditions = useCallback(async () => {
    if (!config.enabled || !isHealthy || !latestOptimization) return;

    const trend = latestOptimization.prediction?.trend_estimate;
    if (trend && Math.abs(trend) > 0.1) { // 10% trend threshold
      const trendDirection = trend > 0 ? 'bullish' : 'bearish';
      const recommendedAction = trend > 0 ? 'increase YT allocation' : 'increase PT allocation';
      
      addAlert({
        type: trend > 0 ? 'opportunity' : 'info',
        title: `Strong ${trendDirection} trend detected`,
        message: `AI model predicts ${(trend * 100).toFixed(1)}% trend. Consider to ${recommendedAction}.`,
        recommendation: latestOptimization,
        action: 'adjust_allocation'
      });
    }
  }, [config.enabled, isHealthy, latestOptimization, addAlert]);

  // Main automation loop
  useEffect(() => {
    if (!config.enabled || !isHealthy) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    
    const interval = setInterval(async () => {
      await Promise.all([
        checkPriceTriggers(),
        generatePeriodicRecommendation(),
        checkMarketConditions(),
      ]);
    }, config.interval);

    // Initial check
    Promise.all([
      checkPriceTriggers(),
      checkMarketConditions(),
    ]);

    return () => {
      clearInterval(interval);
      setIsRunning(false);
    };
  }, [
    config.enabled,
    config.interval,
    isHealthy,
    checkPriceTriggers,
    generatePeriodicRecommendation,
    checkMarketConditions,
  ]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    
    if (updates.enabled !== undefined) {
      addAlert({
        type: 'info',
        title: updates.enabled ? 'Automation Started' : 'Automation Stopped',
        message: updates.enabled 
          ? 'Automated recommendations and monitoring are now active.'
          : 'Automated recommendations have been disabled.',
      });
    }
  }, [addAlert]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Dismiss specific alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Get alerts by type
  const getAlertsByType = useCallback((type: RecommendationAlert['type']) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  // Get recent alerts (last hour)
  const getRecentAlerts = useCallback(() => {
    const oneHourAgo = Date.now() - 3600000;
    return alerts.filter(alert => new Date(alert.timestamp).getTime() > oneHourAgo);
  }, [alerts]);

  // Performance metrics
  const performanceMetrics = {
    totalRecommendations,
    successfulRecommendations,
    successRate: totalRecommendations > 0 ? (successfulRecommendations / totalRecommendations) * 100 : 0,
    totalAlerts: alerts.length,
    recentAlerts: getRecentAlerts().length,
    isRunning,
    uptime: isRunning ? 'Active' : 'Stopped',
  };

  return {
    // Configuration
    config,
    updateConfig,
    
    // Alerts
    alerts,
    addAlert,
    clearAlerts,
    dismissAlert,
    getAlertsByType,
    getRecentAlerts,
    
    // State
    isRunning,
    isHealthy,
    performanceMetrics,
    
    // Manual triggers
    triggerManualCheck: checkPriceTriggers,
    generateManualRecommendation: generatePeriodicRecommendation,
  };
}
