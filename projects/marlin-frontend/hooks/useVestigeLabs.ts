"use client"

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vestigeApiClient, VestigeApiError } from '@/lib/vestige-api';
import { useToast } from '@/hooks/use-toast';
import {
  // Request types
  AssetSearchParams,
  AssetPriceParams,
  AssetCandlesParams,
  AssetHistoryParams,
  PoolsParams,
  VaultsParams,
  BalancesParams,
  SwapsParams,
  SwapV4Params,
  SwapV4TransactionsParams,
  WalletValueParams,
  WalletPnlParams,
  
  // Response types
  NetworksResponse,
  NetworkResponse,
  ProtocolsResponse,
  ProtocolVolumesResponse,
  ProtocolResponse,
  AssetsResponse,
  AssetSearchResponse,
  AssetListResponse,
  AssetPricesResponse,
  AssetCandlesResponse,
  AssetHistoryResponse,
  AssetCompositionResponse,
  AssetResponse,
  PoolsResponse,
  VaultsResponse,
  BalancesResponse,
  NotesResponse,
  FirstAssetNotesResponse,
  AssetNotesCountResponse,
  SwapsResponse,
  MarksResponse,
  WalletValueResponse,
  WalletPnlResponse,
  SwapV4Response,
  SwapV4FeeResponse,
  SwapV4TransactionsResponse,
  AggregatorHistoryResponse,
  PingResponse,
  UsageResponse,
} from '@/lib/vestige-types';

// Query keys for React Query
export const VESTIGE_QUERY_KEYS = {
  networks: ['vestige', 'networks'] as const,
  network: (id: number) => ['vestige', 'networks', id] as const,
  protocols: ['vestige', 'protocols'] as const,
  protocolVolumes: ['vestige', 'protocols', 'volumes'] as const,
  protocol: (id: number) => ['vestige', 'protocols', id] as const,
  assets: (params?: any) => ['vestige', 'assets', params] as const,
  assetSearch: (params: AssetSearchParams) => ['vestige', 'assets', 'search', params] as const,
  assetList: ['vestige', 'assets', 'list'] as const,
  assetPrices: (params?: AssetPriceParams) => ['vestige', 'assets', 'prices', params] as const,
  assetCandles: (assetId: number, params?: AssetCandlesParams) => ['vestige', 'assets', assetId, 'candles', params] as const,
  assetHistory: (assetId: number, params?: AssetHistoryParams) => ['vestige', 'assets', assetId, 'history', params] as const,
  assetComposition: (assetId: number) => ['vestige', 'assets', assetId, 'composition'] as const,
  asset: (id: number) => ['vestige', 'assets', id] as const,
  pools: (params?: PoolsParams) => ['vestige', 'pools', params] as const,
  vaults: (params?: VaultsParams) => ['vestige', 'vaults', params] as const,
  balances: (params: BalancesParams) => ['vestige', 'balances', params] as const,
  notes: (params?: any) => ['vestige', 'notes', params] as const,
  firstAssetNotes: (assetId: number) => ['vestige', 'notes', 'first', assetId] as const,
  assetNotesCount: (assetId: number) => ['vestige', 'notes', 'count', assetId] as const,
  swaps: (params?: SwapsParams) => ['vestige', 'swaps', params] as const,
  marks: ['vestige', 'marks'] as const,
  walletValue: (params: WalletValueParams) => ['vestige', 'wallets', params.address, 'value'] as const,
  walletPnl: (params: WalletPnlParams) => ['vestige', 'wallets', params.address, 'pnl', params.period] as const,
  swapV4: (params: SwapV4Params) => ['vestige', 'swap', 'v4', params] as const,
  swapV4Fee: ['vestige', 'swap', 'v4', 'fee'] as const,
  swapV4Transactions: (params: SwapV4TransactionsParams) => ['vestige', 'swap', 'v4', 'transactions', params] as const,
  aggregatorHistory: (params?: any) => ['vestige', 'swap', 'v4', 'history', params] as const,
  ping: ['vestige', 'ping'] as const,
  usage: ['vestige', 'usage'] as const,
};

// Hook for Vestige Labs API
export function useVestigeLabs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Error handling
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Vestige API ${operation} error:`, error);
    
    if (error instanceof VestigeApiError) {
      toast({
        title: `${operation} failed`,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `${operation} failed`,
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Networks
  const useNetworks = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.networks,
      queryFn: () => vestigeApiClient.getNetworks(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => handleError(error, 'Get networks'),
    });
  };

  const useNetwork = (networkId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.network(networkId),
      queryFn: () => vestigeApiClient.getNetwork(networkId),
      enabled: !!networkId,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get network'),
    });
  };

  // Protocols
  const useProtocols = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.protocols,
      queryFn: () => vestigeApiClient.getProtocols(),
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => handleError(error, 'Get protocols'),
    });
  };

  const useProtocolVolumes = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.protocolVolumes,
      queryFn: () => vestigeApiClient.getProtocolVolumes(),
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => handleError(error, 'Get protocol volumes'),
    });
  };

  const useProtocol = (protocolId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.protocol(protocolId),
      queryFn: () => vestigeApiClient.getProtocol(protocolId),
      enabled: !!protocolId,
      staleTime: 10 * 60 * 1000,
      onError: (error) => handleError(error, 'Get protocol'),
    });
  };

  // Assets
  const useAssets = (params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assets(params),
      queryFn: () => vestigeApiClient.getAssets(params),
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => handleError(error, 'Get assets'),
    });
  };

  const useAssetSearch = (params: AssetSearchParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetSearch(params),
      queryFn: () => vestigeApiClient.searchAssets(params),
      enabled: !!params.query,
      staleTime: 2 * 60 * 1000,
      onError: (error) => handleError(error, 'Search assets'),
    });
  };

  const useAssetList = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetList,
      queryFn: () => vestigeApiClient.getAssetList(),
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset list'),
    });
  };

  const useAssetPrices = (params?: AssetPriceParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetPrices(params),
      queryFn: () => vestigeApiClient.getAssetPrices(params),
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
      onError: (error) => handleError(error, 'Get asset prices'),
    });
  };

  const useAssetCandles = (assetId: number, params?: AssetCandlesParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetCandles(assetId, params),
      queryFn: () => vestigeApiClient.getAssetCandles(assetId, params),
      enabled: !!assetId,
      staleTime: 1 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset candles'),
    });
  };

  const useAssetHistory = (assetId: number, params?: AssetHistoryParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetHistory(assetId, params),
      queryFn: () => vestigeApiClient.getAssetHistory(assetId, params),
      enabled: !!assetId,
      staleTime: 2 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset history'),
    });
  };

  const useAssetComposition = (assetId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetComposition(assetId),
      queryFn: () => vestigeApiClient.getAssetComposition(assetId),
      enabled: !!assetId,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset composition'),
    });
  };

  const useAsset = (assetId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.asset(assetId),
      queryFn: () => vestigeApiClient.getAsset(assetId),
      enabled: !!assetId,
      staleTime: 2 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset'),
    });
  };

  // Pools
  const usePools = (params?: PoolsParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.pools(params),
      queryFn: () => vestigeApiClient.getPools(params),
      staleTime: 1 * 60 * 1000,
      onError: (error) => handleError(error, 'Get pools'),
    });
  };

  // Vaults
  const useVaults = (params?: VaultsParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.vaults(params),
      queryFn: () => vestigeApiClient.getVaults(params),
      staleTime: 2 * 60 * 1000,
      onError: (error) => handleError(error, 'Get vaults'),
    });
  };

  // Balances
  const useBalances = (params: BalancesParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.balances(params),
      queryFn: () => vestigeApiClient.getBalances(params),
      enabled: !!params.address,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      onError: (error) => handleError(error, 'Get balances'),
    });
  };

  // Notes
  const useNotes = (params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.notes(params),
      queryFn: () => vestigeApiClient.getNotes(params),
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get notes'),
    });
  };

  const useFirstAssetNotes = (assetId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.firstAssetNotes(assetId),
      queryFn: () => vestigeApiClient.getFirstAssetNotes(assetId),
      enabled: !!assetId,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get first asset notes'),
    });
  };

  const useAssetNotesCount = (assetId: number) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.assetNotesCount(assetId),
      queryFn: () => vestigeApiClient.getAssetNotesCount(assetId),
      enabled: !!assetId,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get asset notes count'),
    });
  };

  // Swaps
  const useSwaps = (params?: SwapsParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.swaps(params),
      queryFn: () => vestigeApiClient.getSwaps(params),
      staleTime: 30 * 1000,
      onError: (error) => handleError(error, 'Get swaps'),
    });
  };

  const useMarks = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.marks,
      queryFn: () => vestigeApiClient.getMarks(),
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get marks'),
    });
  };

  // Wallets
  const useWalletValue = (params: WalletValueParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.walletValue(params),
      queryFn: () => vestigeApiClient.getWalletValue(params),
      enabled: !!params.address,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
      onError: (error) => handleError(error, 'Get wallet value'),
    });
  };

  const useWalletPnl = (params: WalletPnlParams) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.walletPnl(params),
      queryFn: () => vestigeApiClient.getWalletPnl(params),
      enabled: !!params.address,
      staleTime: 1 * 60 * 1000,
      onError: (error) => handleError(error, 'Get wallet PnL'),
    });
  };

  // Aggregator
  const useSwapV4 = (params: SwapV4Params) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.swapV4(params),
      queryFn: () => vestigeApiClient.getSwapV4(params),
      enabled: !!(params.from_asset_id && params.to_asset_id && params.amount),
      staleTime: 10 * 1000, // 10 seconds
      onError: (error) => handleError(error, 'Get swap V4 data'),
    });
  };

  const useSwapV4Fee = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.swapV4Fee,
      queryFn: () => vestigeApiClient.getSwapV4Fee(),
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleError(error, 'Get swap V4 fee'),
    });
  };

  const useSwapV4Transactions = () => {
    return useMutation({
      mutationFn: (params: SwapV4TransactionsParams) => vestigeApiClient.getSwapV4Transactions(params),
      onError: (error) => handleError(error, 'Get swap V4 transactions'),
    });
  };

  const useAggregatorHistory = (params?: { limit?: number; cursor?: string }) => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.aggregatorHistory(params),
      queryFn: () => vestigeApiClient.getAggregatorHistory(params),
      staleTime: 1 * 60 * 1000,
      onError: (error) => handleError(error, 'Get aggregator history'),
    });
  };

  // Other
  const usePing = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.ping,
      queryFn: () => vestigeApiClient.ping(),
      staleTime: 30 * 1000,
      onError: (error) => handleError(error, 'Ping'),
    });
  };

  const useUsage = () => {
    return useQuery({
      queryKey: VESTIGE_QUERY_KEYS.usage,
      queryFn: () => vestigeApiClient.getUsage(),
      staleTime: 1 * 60 * 1000,
      onError: (error) => handleError(error, 'Get usage'),
    });
  };

  // Utility functions
  const invalidateQueries = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const refetchQueries = useCallback((queryKey: string[]) => {
    queryClient.refetchQueries({ queryKey });
  }, [queryClient]);

  return {
    // Networks
    useNetworks,
    useNetwork,
    
    // Protocols
    useProtocols,
    useProtocolVolumes,
    useProtocol,
    
    // Assets
    useAssets,
    useAssetSearch,
    useAssetList,
    useAssetPrices,
    useAssetCandles,
    useAssetHistory,
    useAssetComposition,
    useAsset,
    
    // Pools
    usePools,
    
    // Vaults
    useVaults,
    
    // Balances
    useBalances,
    
    // Notes
    useNotes,
    useFirstAssetNotes,
    useAssetNotesCount,
    
    // Swaps
    useSwaps,
    useMarks,
    
    // Wallets
    useWalletValue,
    useWalletPnl,
    
    // Aggregator
    useSwapV4,
    useSwapV4Fee,
    useSwapV4Transactions,
    useAggregatorHistory,
    
    // Other
    usePing,
    useUsage,
    
    // Utilities
    invalidateQueries,
    refetchQueries,
  };
}
