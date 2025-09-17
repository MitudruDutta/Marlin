// src/hooks/useTokenDetails.ts
import { useQuery } from '@tanstack/react-query';
import { getAlgorandAssetDetails } from '../app/api/algorandtokendetails';

export function useTokenDetails(assetId: number | null) {
  const {
    data,
    error,
    refetch,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['tokenDetails', assetId],
    queryFn: () => {
      if (!assetId) throw new Error('Asset ID is required');
      return getAlgorandAssetDetails(assetId);
    },
    enabled: !!assetId, // Only run query if assetId is provided
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