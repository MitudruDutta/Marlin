import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface BlockchainTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  contractAddress: string;
  confirmations: string;
  isError?: string;
  txreceipt_status?: string;
  methodId?: string;
  functionName?: string;
}

export interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  value: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export interface ContractEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

export interface BlockchainHistory {
  transactions: BlockchainTransaction[];
  tokenTransfers: TokenTransfer[];
  contractEvents: ContractEvent[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

import { API_KEYS, API_ENDPOINTS } from '@/lib/config/api';

// API Configuration
const API_CONFIG = {
  avalanche: {
    testnet: {
      baseUrl: API_ENDPOINTS.AVALANCHE.TESTNET,
      apiKey: API_KEYS.SNOWTRACE_TESTNET,
      chainId: 43113
    },
    mainnet: {
      baseUrl: API_ENDPOINTS.AVALANCHE.MAINNET,
      apiKey: API_KEYS.SNOWTRACE_MAINNET,
      chainId: 43114
    }
  },
  ethereum: {
    testnet: {
      baseUrl: API_ENDPOINTS.ETHEREUM.SEPOLIA,
      apiKey: API_KEYS.ETHERSCAN_SEPOLIA,
      chainId: 11155111
    },
    mainnet: {
      baseUrl: API_ENDPOINTS.ETHEREUM.MAINNET,
      apiKey: API_KEYS.ETHERSCAN_MAINNET,
      chainId: 1
    }
  }
};

export function useBlockchainHistory() {
  const { address, isConnected } = useAccount();
  const [history, setHistory] = useState<BlockchainHistory>({
    transactions: [],
    tokenTransfers: [],
    contractEvents: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Fetch transactions from Snowtrace API
  const fetchTransactions = useCallback(async (walletAddress: string, network: 'avalanche' | 'ethereum' = 'avalanche', isTestnet: boolean = true) => {
    if (!walletAddress) return;

    const config = API_CONFIG[network][isTestnet ? 'testnet' : 'mainnet'];
    
    try {
      setHistory(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch normal transactions
      const txResponse = await fetch(
        `${config.baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${config.apiKey}`
      );
      
      const txData = await txResponse.json();
      
      if (txData.status === '1') {
        setHistory(prev => ({
          ...prev,
          transactions: txData.result,
          lastUpdated: new Date()
        }));
      } else {
        console.warn('Failed to fetch transactions:', txData.message);
      }

      // Fetch token transfers (ERC20)
      const tokenResponse = await fetch(
        `${config.baseUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${config.apiKey}`
      );
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.status === '1') {
        setHistory(prev => ({
          ...prev,
          tokenTransfers: tokenData.result,
          lastUpdated: new Date()
        }));
      } else {
        console.warn('Failed to fetch token transfers:', tokenData.message);
      }

      // Fetch contract events (logs)
      const logsResponse = await fetch(
        `${config.baseUrl}?module=logs&action=getLogs&address=${walletAddress}&fromBlock=0&toBlock=latest&apikey=${config.apiKey}`
      );
      
      const logsData = await logsResponse.json();
      
      if (logsData.status === '1') {
        setHistory(prev => ({
          ...prev,
          contractEvents: logsData.result,
          lastUpdated: new Date()
        }));
      } else {
        console.warn('Failed to fetch contract events:', logsData.message);
      }

    } catch (error) {
      console.error('Error fetching blockchain history:', error);
      setHistory(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch blockchain history',
        isLoading: false
      }));
    } finally {
      setHistory(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch history when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions(address);
    }
  }, [isConnected, address, fetchTransactions]);

  // Parse transaction method from input data
  const parseTransactionMethod = useCallback((input: string) => {
    if (!input || input === '0x') return 'Transfer';
    
    // Common DeFi method signatures
    const methodSignatures: Record<string, string> = {
      '0xa9059cbb': 'Transfer',
      '0x23b872dd': 'TransferFrom',
      '0x095ea7b3': 'Approve',
      '0x40c10f19': 'Mint',
      '0x42966c68': 'Burn',
      '0x6ea056a9': 'Wrap',
      '0x1cff79cd': 'Split',
      '0x8f283970': 'Combine',
      '0x1249c58b': 'Stake',
      '0x9e1a00aa': 'Unstake'
    };

    const methodId = input.slice(0, 10);
    return methodSignatures[methodId] || 'Contract Call';
  }, []);

  // Get transaction type based on contract interaction
  const getTransactionType = useCallback((tx: BlockchainTransaction) => {
    if (tx.contractAddress && tx.contractAddress !== '') {
      const method = parseTransactionMethod(tx.input);
      
      // Map to our activity log types
      switch (method) {
        case 'Wrap':
          return 'wrap';
        case 'Split':
          return 'split';
        case 'Combine':
          return 'combine';
        case 'Stake':
          return 'stake';
        case 'Unstake':
          return 'unstake';
        case 'Approve':
          return 'approval';
        case 'Transfer':
          return 'transaction';
        default:
          return 'transaction';
      }
    }
    
    return 'transaction';
  }, [parseTransactionMethod]);

  // Convert blockchain transactions to activity logs format
  const convertToActivityLogs = useCallback(() => {
    const logs = [];

    // Convert transactions
    for (const tx of history.transactions) {
      const type = getTransactionType(tx);
      const isError = tx.isError === '1' || tx.txreceipt_status === '0';
      
      logs.push({
        id: tx.hash,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        type,
        status: isError ? 'failed' : 'success',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Transaction`,
        description: `${type} transaction ${isError ? 'failed' : 'completed'}`,
        txHash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        gasUsed: BigInt(tx.gasUsed || '0'),
        metadata: {
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasUsed: tx.gasUsed,
          method: parseTransactionMethod(tx.input)
        }
      });
    }

    // Convert token transfers
    for (const transfer of history.tokenTransfers) {
      logs.push({
        id: `transfer-${transfer.hash}-${transfer.logIndex}`,
        timestamp: new Date(parseInt(transfer.timeStamp) * 1000),
        type: 'transaction',
        status: 'success',
        title: `Transfer ${transfer.tokenSymbol}`,
        description: `Transferred ${transfer.value} ${transfer.tokenSymbol} from ${transfer.from} to ${transfer.to}`,
        txHash: transfer.hash,
        blockNumber: parseInt(transfer.blockNumber),
        metadata: {
          tokenName: transfer.tokenName,
          tokenSymbol: transfer.tokenSymbol,
          value: transfer.value,
          from: transfer.from,
          to: transfer.to
        }
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [history, getTransactionType, parseTransactionMethod]);

  // Refresh history
  const refreshHistory = useCallback(() => {
    if (address) {
      fetchTransactions(address);
    }
  }, [address, fetchTransactions]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory({
      transactions: [],
      tokenTransfers: [],
      contractEvents: [],
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  return {
    history,
    fetchTransactions,
    refreshHistory,
    clearHistory,
    convertToActivityLogs,
    parseTransactionMethod,
    getTransactionType
  };
} 