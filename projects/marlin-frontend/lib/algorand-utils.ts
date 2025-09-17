import algosdk from 'algosdk';
import { useWallet } from '@/components/WalletProvider';

// Algorand network configuration
export const ALGORAND_CONFIG = {
  testnet: {
    algodToken: '',
    algodServer: 'https://testnet-api.algonode.cloud',
    algodPort: 443,
    indexerToken: '',
    indexerServer: 'https://testnet-idx.algonode.cloud',
    indexerPort: 443,
  },
  mainnet: {
    algodToken: '',
    algodServer: 'https://mainnet-api.algonode.cloud',
    algodPort: 443,
    indexerToken: '',
    indexerServer: 'https://mainnet-idx.algonode.cloud',
    indexerPort: 443,
  }
};

// Contract addresses (these should be replaced with actual deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  PRICE_ORACLE: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '0x0',
  PT_TOKEN: process.env.NEXT_PUBLIC_PT_TOKEN_ADDRESS || '0x0',
  YT_TOKEN: process.env.NEXT_PUBLIC_YT_TOKEN_ADDRESS || '0x0',
  SIMPLE_AMM: process.env.NEXT_PUBLIC_SIMPLE_AMM_ADDRESS || '0x0',
  STAKING_DAPP: process.env.NEXT_PUBLIC_STAKING_DAPP_ADDRESS || '0x0',
  YIELD_TOKENIZATION: process.env.NEXT_PUBLIC_YIELD_TOKENIZATION_ADDRESS || '0x0',
  YT_AUTO_CONVERTER: process.env.NEXT_PUBLIC_YT_AUTO_CONVERTER_ADDRESS || '0x0',
  STANDARDIZED_WRAPPER: process.env.NEXT_PUBLIC_STANDARDIZED_WRAPPER_ADDRESS || '0x0',
};

// Create Algorand client
export function createAlgorandClient(network: 'testnet' | 'mainnet' = 'testnet') {
  const config = ALGORAND_CONFIG[network];
  return new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort);
}

// Create Indexer client
export function createIndexerClient(network: 'testnet' | 'mainnet' = 'testnet') {
  const config = ALGORAND_CONFIG[network];
  return new algosdk.Indexer(config.indexerToken, config.indexerServer, config.indexerPort);
}

// Transaction preparation utilities
export class AlgorandTransactionBuilder {
  private client: algosdk.Algodv2;
  private network: 'testnet' | 'mainnet';

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    this.client = createAlgorandClient(network);
  }

  // Prepare a basic payment transaction
  async preparePaymentTransaction(
    from: string,
    to: string,
    amount: number,
    note?: string
  ): Promise<algosdk.Transaction> {
    const params = await this.client.getTransactionParams().do();
    
    return algosdk.makePaymentTxnWithSuggestedParams(
      from,
      to,
      amount,
      undefined,
      note ? new Uint8Array(Buffer.from(note)) : undefined,
      params
    );
  }

  // Prepare an asset transfer transaction
  async prepareAssetTransferTransaction(
    from: string,
    to: string,
    assetId: number,
    amount: number,
    note?: string
  ): Promise<algosdk.Transaction> {
    const params = await this.client.getTransactionParams().do();
    
    return algosdk.makeAssetTransferTxnWithSuggestedParams(
      from,
      to,
      undefined,
      undefined,
      amount,
      note ? new Uint8Array(Buffer.from(note)) : undefined,
      assetId,
      params
    );
  }

  // Prepare an application call transaction
  async prepareApplicationCallTransaction(
    from: string,
    appId: number,
    method: string,
    args: (string | number | Uint8Array)[] = [],
    accounts: string[] = [],
    foreignAssets: number[] = [],
    foreignApps: number[] = [],
    note?: string
  ): Promise<algosdk.Transaction> {
    const params = await this.client.getTransactionParams().do();
    
    // Convert method name to method selector (first 4 bytes of hash)
    const methodSelector = algosdk.getMethodByName(method);
    
    return algosdk.makeApplicationCallTxnWithSuggestedParams(
      from,
      params,
      appId,
      algosdk.OnApplicationComplete.NoOpOC,
      methodSelector,
      args,
      accounts,
      foreignApps,
      foreignAssets,
      undefined,
      note ? new Uint8Array(Buffer.from(note)) : undefined
    );
  }

  // Prepare an asset opt-in transaction
  async prepareAssetOptInTransaction(
    from: string,
    assetId: number
  ): Promise<algosdk.Transaction> {
    return this.prepareAssetTransferTransaction(from, from, assetId, 0);
  }

  // Prepare an application opt-in transaction
  async prepareApplicationOptInTransaction(
    from: string,
    appId: number
  ): Promise<algosdk.Transaction> {
    const params = await this.client.getTransactionParams().do();
    
    return algosdk.makeApplicationOptInTxnWithSuggestedParams(
      from,
      params,
      appId
    );
  }
}

// Transaction signing and submission utilities
export class AlgorandTransactionManager {
  private client: algosdk.Algodv2;
  private network: 'testnet' | 'mainnet';

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    this.client = createAlgorandClient(network);
  }

  // Sign and submit a single transaction
  async signAndSubmitTransaction(
    transaction: algosdk.Transaction,
    signer: any // Wallet signer
  ): Promise<string> {
    try {
      // Sign the transaction
      const signedTxn = await signer.signTxn(transaction);
      
      // Submit the transaction
      const result = await this.client.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.client,
        result.txId,
        4
      );
      
      return result.txId;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sign and submit multiple transactions as a group
  async signAndSubmitTransactionGroup(
    transactions: algosdk.Transaction[],
    signer: any // Wallet signer
  ): Promise<string[]> {
    try {
      // Assign group ID to transactions
      algosdk.assignGroupID(transactions);
      
      // Sign all transactions
      const signedTxns = await signer.signTxn(transactions);
      
      // Submit the transaction group
      const result = await this.client.sendRawTransaction(signedTxns).do();
      
      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.client,
        result.txId,
        4
      );
      
      return transactions.map(txn => txn.txID());
    } catch (error) {
      console.error('Transaction group failed:', error);
      throw new Error(`Transaction group failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get transaction status
  async getTransactionStatus(txId: string): Promise<any> {
    try {
      const txn = await this.client.pendingTransactionInformation(txId).do();
      return txn;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  // Get account information
  async getAccountInfo(address: string): Promise<any> {
    try {
      const accountInfo = await this.client.accountInformation(address).do();
      return accountInfo;
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  // Get asset information
  async getAssetInfo(assetId: number): Promise<any> {
    try {
      const assetInfo = await this.client.getAssetByID(assetId).do();
      return assetInfo;
    } catch (error) {
      console.error('Failed to get asset info:', error);
      throw error;
    }
  }

  // Get application information
  async getApplicationInfo(appId: number): Promise<any> {
    try {
      const appInfo = await this.client.getApplicationByID(appId).do();
      return appInfo;
    } catch (error) {
      console.error('Failed to get application info:', error);
      throw error;
    }
  }
}

// Utility functions for common operations
export const AlgorandUtils = {
  // Convert microAlgos to Algos
  microAlgosToAlgos: (microAlgos: number): number => microAlgos / 1e6,
  
  // Convert Algos to microAlgos
  algosToMicroAlgos: (algos: number): number => Math.round(algos * 1e6),
  
  // Format address for display
  formatAddress: (address: string, length: number = 8): string => {
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  },
  
  // Validate Algorand address
  isValidAddress: (address: string): boolean => {
    try {
      return algosdk.isValidAddress(address);
    } catch {
      return false;
    }
  },
  
  // Get network from environment
  getNetwork: (): 'testnet' | 'mainnet' => {
    return process.env.NEXT_PUBLIC_ALGORAND_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  },
  
  // Get explorer URL for transaction
  getExplorerUrl: (txId: string, network?: 'testnet' | 'mainnet'): string => {
    const net = network || AlgorandUtils.getNetwork();
    const baseUrl = net === 'mainnet' ? 'https://algoexplorer.io' : 'https://testnet.algoexplorer.io';
    return `${baseUrl}/tx/${txId}`;
  },
  
  // Get explorer URL for address
  getAddressExplorerUrl: (address: string, network?: 'testnet' | 'mainnet'): string => {
    const net = network || AlgorandUtils.getNetwork();
    const baseUrl = net === 'mainnet' ? 'https://algoexplorer.io' : 'https://testnet.algoexplorer.io';
    return `${baseUrl}/address/${address}`;
  }
};

// Error handling utilities
export class AlgorandError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AlgorandError';
  }
}

// Common error messages
export const ALGORAND_ERRORS = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_ADDRESS: 'Invalid address',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error',
  USER_REJECTED: 'User rejected transaction',
  TIMEOUT: 'Transaction timeout',
} as const;
