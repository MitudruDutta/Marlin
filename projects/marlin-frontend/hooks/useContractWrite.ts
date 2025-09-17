import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { useWallet } from '../components/WalletProvider';

interface ContractWriteOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  invalidateQueries?: string[][];
}

// Generic hook for Algorand contract write operations
export function useContractWrite<TVariables = unknown, TData = string>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ContractWriteOptions<TData, TVariables>
) {
  const { activeAddress } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      if (!activeAddress) {
        throw new Error('Algorand wallet not connected');
      }
      
      try {
        return await mutationFn(variables);
      } catch (error: any) {
        console.error('Algorand contract write error:', error);
        throw new Error(error instanceof Error ? error.message : 'Contract write failed');
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      console.error('Contract write mutation error:', error);
      options?.onError?.(error, variables);
    },
    onSettled: (data, error: Error | null, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for Algorand transaction with confirmation waiting
export function useContractTransaction<TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<string>,
  options?: ContractWriteOptions<string, TVariables>
) {
  return useContractWrite(mutationFn, options);
}

// Hook for multiple Algorand contract writes in sequence
export function useMultipleContractWrites<TVariables = unknown>(
  mutationFns: ((variables: TVariables) => Promise<string>)[],
  options?: ContractWriteOptions<string[], TVariables>
) {
  return useContractWrite(
    async (variables: TVariables): Promise<string[]> => {
      const results: string[] = [];
      
      for (const fn of mutationFns) {
        const result = await fn(variables);
        results.push(result);
      }
      
      return results;
    },
    options
  );
}