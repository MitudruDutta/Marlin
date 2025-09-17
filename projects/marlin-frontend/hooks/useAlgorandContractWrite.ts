"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../components/WalletProvider';

interface AlgorandContractWriteOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  invalidateQueries?: string[][];
}

// Generic hook for Algorand contract write operations
export function useAlgorandContractWrite<TVariables = unknown, TData = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: AlgorandContractWriteOptions<TData, TVariables>
) {
  const { activeAddress } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      if (!activeAddress) {
        throw new Error('Algorand wallet not connected');
      }
      
      return await mutationFn(variables);
    },
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}
