// src/hooks/useTokenHistory.ts
import { useQuery } from '@tanstack/react-query';
import { tokenhistory } from '../api/tokenhistory';

export function useTokenHistory(coinId: string | null, days: number = 30) {
  const {
    data,
    error,
    refetch,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['tokenHistory', coinId, days],
    queryFn: () => {
      if (!coinId) throw new Error('Coin ID is required');
      return tokenhistory(coinId, days);
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