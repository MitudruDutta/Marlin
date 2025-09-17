"use client"

import { useState, useCallback } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { 
  AlgorandTransactionBuilder, 
  AlgorandTransactionManager, 
  AlgorandUtils,
  ALGORAND_ERRORS,
  AlgorandError,
  CONTRACT_ADDRESSES
} from '@/lib/algorand-utils';
import { useToast } from '@/hooks/use-toast';

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  lastTxId: string | null;
}

interface TransactionOptions {
  onSuccess?: (txId: string) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export function useAlgorandTransaction() {
  const { activeAddress, signer } = useWallet();
  const { toast } = useToast();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    lastTxId: null,
  });

  const network = AlgorandUtils.getNetwork();
  const transactionBuilder = new AlgorandTransactionBuilder(network);
  const transactionManager = new AlgorandTransactionManager(network);

  // Generic transaction execution function
  const executeTransaction = useCallback(async (
    transaction: any,
    options?: TransactionOptions
  ): Promise<string> => {
    if (!activeAddress || !signer) {
      const error = new AlgorandError(ALGORAND_ERRORS.WALLET_NOT_CONNECTED);
      options?.onError?.(error);
      throw error;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const txId = await transactionManager.signAndSubmitTransaction(transaction, signer);
      
      setState(prev => ({ ...prev, lastTxId: txId, isLoading: false }));
      
      toast({
        title: "Transaction successful",
        description: `Transaction submitted: ${AlgorandUtils.formatAddress(txId)}`,
      });

      options?.onSuccess?.(txId);
      return txId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      });

      const algorandError = new AlgorandError(errorMessage);
      options?.onError?.(algorandError);
      throw algorandError;
    } finally {
      options?.onSettled?.();
    }
  }, [activeAddress, signer, transactionManager, toast]);

  // Price Oracle operations
  const updatePrice = useCallback(async (
    newPrice: number,
    confidence: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.PRICE_ORACLE);
    if (!appId || appId === 0) {
      throw new AlgorandError('Price Oracle contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'update_price',
      [
        AlgorandUtils.algosToMicroAlgos(newPrice),
        confidence
      ],
      [],
      [],
      [],
      `Update price to ${newPrice} with ${confidence}% confidence`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const setPriceThreshold = useCallback(async (
    threshold: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.PRICE_ORACLE);
    if (!appId || appId === 0) {
      throw new AlgorandError('Price Oracle contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'set_threshold',
      [AlgorandUtils.algosToMicroAlgos(threshold)],
      [],
      [],
      [],
      `Set price threshold to ${threshold}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const toggleCircuitBreaker = useCallback(async (
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.PRICE_ORACLE);
    if (!appId || appId === 0) {
      throw new AlgorandError('Price Oracle contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'toggle_circuit_breaker',
      [],
      [],
      [],
      [],
      'Toggle circuit breaker'
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  // AMM Interface operations
  const splitTokens = useCallback(async (
    amount: number,
    maturityTimestamp: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.SIMPLE_AMM);
    if (!appId || appId === 0) {
      throw new AlgorandError('Simple AMM contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'split_tokens',
      [
        AlgorandUtils.algosToMicroAlgos(amount),
        maturityTimestamp
      ],
      [],
      [],
      [],
      `Split ${amount} SY tokens for maturity ${new Date(maturityTimestamp).toLocaleDateString()}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const redeemTokens = useCallback(async (
    amount: number,
    maturityTimestamp: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.SIMPLE_AMM);
    if (!appId || appId === 0) {
      throw new AlgorandError('Simple AMM contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'redeem_tokens',
      [
        AlgorandUtils.algosToMicroAlgos(amount),
        maturityTimestamp
      ],
      [],
      [],
      [],
      `Redeem ${amount} PT tokens for maturity ${new Date(maturityTimestamp).toLocaleDateString()}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const createMaturity = useCallback(async (
    maturityDate: string,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.SIMPLE_AMM);
    if (!appId || appId === 0) {
      throw new AlgorandError('Simple AMM contract not configured');
    }

    const maturityTimestamp = new Date(maturityDate).getTime();

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'create_maturity',
      [maturityTimestamp],
      [],
      [],
      [],
      `Create new maturity for ${maturityDate}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  // Staking operations
  const stakeTokens = useCallback(async (
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.STAKING_DAPP);
    if (!appId || appId === 0) {
      throw new AlgorandError('Staking contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'stake',
      [AlgorandUtils.algosToMicroAlgos(amount)],
      [],
      [],
      [],
      `Stake ${amount} tokens`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const unstakeTokens = useCallback(async (
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.STAKING_DAPP);
    if (!appId || appId === 0) {
      throw new AlgorandError('Staking contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'unstake',
      [AlgorandUtils.algosToMicroAlgos(amount)],
      [],
      [],
      [],
      `Unstake ${amount} tokens`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const claimRewards = useCallback(async (
    options?: TransactionOptions
  ): Promise<string> => {
    const appId = parseInt(CONTRACT_ADDRESSES.STAKING_DAPP);
    if (!appId || appId === 0) {
      throw new AlgorandError('Staking contract not configured');
    }

    const transaction = await transactionBuilder.prepareApplicationCallTransaction(
      activeAddress!,
      appId,
      'claim_rewards',
      [],
      [],
      [],
      [],
      'Claim staking rewards'
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  // Token management operations
  const transferPT = useCallback(async (
    to: string,
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const assetId = parseInt(CONTRACT_ADDRESSES.PT_TOKEN);
    if (!assetId || assetId === 0) {
      throw new AlgorandError('PT Token contract not configured');
    }

    const transaction = await transactionBuilder.prepareAssetTransferTransaction(
      activeAddress!,
      to,
      assetId,
      AlgorandUtils.algosToMicroAlgos(amount),
      `Transfer ${amount} PT tokens to ${AlgorandUtils.formatAddress(to)}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const transferYT = useCallback(async (
    to: string,
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const assetId = parseInt(CONTRACT_ADDRESSES.YT_TOKEN);
    if (!assetId || assetId === 0) {
      throw new AlgorandError('YT Token contract not configured');
    }

    const transaction = await transactionBuilder.prepareAssetTransferTransaction(
      activeAddress!,
      to,
      assetId,
      AlgorandUtils.algosToMicroAlgos(amount),
      `Transfer ${amount} YT tokens to ${AlgorandUtils.formatAddress(to)}`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const burnPT = useCallback(async (
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const assetId = parseInt(CONTRACT_ADDRESSES.PT_TOKEN);
    if (!assetId || assetId === 0) {
      throw new AlgorandError('PT Token contract not configured');
    }

    // Burn by sending to zero address
    const zeroAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const transaction = await transactionBuilder.prepareAssetTransferTransaction(
      activeAddress!,
      zeroAddress,
      assetId,
      AlgorandUtils.algosToMicroAlgos(amount),
      `Burn ${amount} PT tokens`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  const burnYT = useCallback(async (
    amount: number,
    options?: TransactionOptions
  ): Promise<string> => {
    const assetId = parseInt(CONTRACT_ADDRESSES.YT_TOKEN);
    if (!assetId || assetId === 0) {
      throw new AlgorandError('YT Token contract not configured');
    }

    // Burn by sending to zero address
    const zeroAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const transaction = await transactionBuilder.prepareAssetTransferTransaction(
      activeAddress!,
      zeroAddress,
      assetId,
      AlgorandUtils.algosToMicroAlgos(amount),
      `Burn ${amount} YT tokens`
    );

    return executeTransaction(transaction, options);
  }, [activeAddress, transactionBuilder, executeTransaction]);

  // Utility functions
  const getAccountInfo = useCallback(async (address?: string) => {
    const targetAddress = address || activeAddress;
    if (!targetAddress) {
      throw new AlgorandError(ALGORAND_ERRORS.WALLET_NOT_CONNECTED);
    }
    return transactionManager.getAccountInfo(targetAddress);
  }, [activeAddress, transactionManager]);

  const getTransactionStatus = useCallback(async (txId: string) => {
    return transactionManager.getTransactionStatus(txId);
  }, [transactionManager]);

  return {
    // State
    ...state,
    isConnected: !!activeAddress,
    
    // Price Oracle operations
    updatePrice,
    setPriceThreshold,
    toggleCircuitBreaker,
    
    // AMM operations
    splitTokens,
    redeemTokens,
    createMaturity,
    
    // Staking operations
    stakeTokens,
    unstakeTokens,
    claimRewards,
    
    // Token management operations
    transferPT,
    transferYT,
    burnPT,
    burnYT,
    
    // Utility functions
    getAccountInfo,
    getTransactionStatus,
    
    // Direct access to builders/managers
    transactionBuilder,
    transactionManager,
  };
}
