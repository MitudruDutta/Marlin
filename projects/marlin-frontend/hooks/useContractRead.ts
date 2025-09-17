import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useWallet } from '../components/WalletProvider';

// Generic hook for Algorand contract read operations
export function useContractRead<TData = unknown>(
  queryKey: string[],
  contractFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  const { activeAddress } = useWallet();

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeAddress) {
        throw new Error('Algorand wallet not connected');
      }
      
      try {
        return await contractFn();
      } catch (error) {
        console.error('Algorand contract read error:', error);
        throw new Error(error instanceof Error ? error.message : 'Contract read failed');
      }
    },
    enabled: !!activeAddress && (options?.enabled ?? true),
    staleTime: 30000, // 30 seconds
    retry: 2,
    ...options,
  });
}

// Hook for reading multiple Algorand contract values at once
export function useMultipleContractReads<TData extends Record<string, unknown>>(
  queryKey: string[],
  contractCalls: Record<keyof TData, () => Promise<TData[keyof TData]>>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  const { activeAddress } = useWallet();

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TData> => {
      if (!activeAddress) {
        throw new Error('Algorand wallet not connected');
      }
      
      try {
        const results = await Promise.all(
          Object.entries(contractCalls).map(async ([key, fn]) => [
            key,
            await (fn as () => Promise<unknown>)(),
          ])
        );
        
        return Object.fromEntries(results) as TData;
      } catch (error) {
        console.error('Multiple Algorand contract read error:', error);
        throw new Error(error instanceof Error ? error.message : 'Multiple contract reads failed');
      }
    },
    enabled: !!activeAddress && (options?.enabled ?? true),
    staleTime: 30000,
    retry: 2,
    ...options,
  });
}