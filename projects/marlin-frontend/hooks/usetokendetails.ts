// src/hooks/useTokenDetails.ts
import { useQuery } from '@tanstack/react-query';
import { tokendetails } from '@/api/tokendetails';

export function useTokenDetails(coinId: string | null) {
  const {
    data,
    error,
    refetch,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['tokenDetails', coinId],
    queryFn: () => {
      if (!coinId) throw new Error('Coin ID is required');
      return tokendetails(coinId);
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