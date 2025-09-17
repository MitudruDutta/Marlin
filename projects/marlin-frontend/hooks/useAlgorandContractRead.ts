import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useWallet } from '../components/WalletProvider';

// Generic hook for Algorand contract read operations
export function useAlgorandContractRead<TData = unknown>(
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
        console.error('Contract read error:', error);
        throw error;
      }
    },
    enabled: !!activeAddress && (options?.enabled !== false),
    retry: 1,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}
