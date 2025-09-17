import { useQuery } from '@tanstack/react-query';
import { optimizePerformance } from '../app/api/algorandtokenperformance';

type RiskProfile = "conservative" | "aggressive" | "moderate";

export function useTokenPerformance(coinId: string | null, risk: RiskProfile = "moderate") {
  const {
    data,
    error,
    refetch,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['tokenPerformance', coinId, risk],
    queryFn: () => {
      if (!coinId) throw new Error('Coin ID is required');
      return optimizePerformance(coinId, risk);
    },
    enabled: !!coinId, // Only run query if coinId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return {
    data,
    error,
    refetch,
    isLoading,
    isError,
    isFetching,
  };
}