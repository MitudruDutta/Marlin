import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'transaction' | 'approval' | 'wrap' | 'split' | 'combine' | 'stake' | 'unstake' | 'swap' | 'error' | 'info';
  status: 'pending' | 'success' | 'failed' | 'completed';
  title: string;
  description: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ContractEvent {
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
  logIndex: number;
  eventName: string;
  args: any;
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // For now, we'll work without wallet connection to avoid WagmiProvider issues

  // Helper function to serialize logs for localStorage
  const serializeLogs = useCallback((logs: ActivityLog[]) => {
    return logs.map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      gasUsed: log.gasUsed ? log.gasUsed.toString() : undefined
    }));
  }, []);

  // Helper function to deserialize logs from localStorage
  const deserializeLogs = useCallback((storedLogs: any[]): ActivityLog[] => {
    return storedLogs.map((log: any) => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp),
      gasUsed: log.gasUsed && typeof log.gasUsed === 'string' ? BigInt(log.gasUsed) : log.gasUsed
    }));
  }, []);

  // Add a new activity log
  const addLog = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setLogs(prev => [newLog, ...prev]);
    
    // Store in localStorage for persistence
    const storedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    storedLogs.unshift(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(serializeLogs(storedLogs.slice(0, 100)))); // Keep last 100 logs
    
    return newLog; // Return the created log
  }, [serializeLogs]);

  // Update log status
  const updateLog = useCallback((id: string, updates: Partial<ActivityLog>) => {
    setLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...updates } : log
    ));
    
    // Update localStorage
    const storedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const updatedLogs = storedLogs.map((log: ActivityLog) => 
      log.id === id ? { ...log, ...updates } : log
    );
    localStorage.setItem('activityLogs', JSON.stringify(serializeLogs(updatedLogs)));
  }, [serializeLogs]);

  // Load logs from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('activityLogs');
    if (storedLogs) {
      try {
        const parsedLogs = deserializeLogs(JSON.parse(storedLogs));
        setLogs(parsedLogs);
      } catch (error) {
        console.error('Failed to parse stored logs:', error);
        // Clear corrupted data and start fresh
        localStorage.removeItem('activityLogs');
        // Fall through to create sample logs
      }
    }
    
    // Create sample logs if no valid logs exist
    if (logs.length === 0) {
      // Add some sample logs for demonstration
      const sampleLogs: ActivityLog[] = [
        {
          id: 'sample-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          type: 'wrap',
          status: 'success',
          title: 'Wrap 100.0000 stAVAX',
          description: 'Successfully wrapped 100 stAVAX to SY tokens',
          txHash: '0x1234...5678',
          blockNumber: 12345678,
          gasUsed: BigInt(150000),
          metadata: {
            token: 'stAVAX',
            amount: '100.0000',
            balance: '500.0000'
          }
        },
        {
          id: 'sample-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          type: 'split',
          status: 'success',
          title: 'Split 50.0000 SY',
          description: 'Successfully split 50 SY into PT and YT tokens',
          txHash: '0x8765...4321',
          blockNumber: 12345677,
          gasUsed: BigInt(200000),
          metadata: {
            amount: '50.0000',
            maturity: '6 months',
            ptAmount: '25.0000',
            ytAmount: '25.0000'
          }
        },
        {
          id: 'sample-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          type: 'approval',
          status: 'success',
          title: 'Approve 200.0000 USDC.e',
          description: 'Approved USDC.e spending for SY wrapper contract',
          txHash: '0xabcd...efgh',
          blockNumber: 12345676,
          gasUsed: BigInt(50000),
          metadata: {
            token: 'USDC.e',
            amount: '200.0000',
            spender: '0xc94a4fA575723aa0c8f4079ee0a8dEdAd05510c6'
          }
        }
      ];
      
      setLogs(sampleLogs);
      localStorage.setItem('activityLogs', JSON.stringify(serializeLogs(sampleLogs)));
    }
  }, [deserializeLogs, serializeLogs]);

  // Track transaction events
  const trackTransaction = useCallback((type: ActivityLog['type'], title: string, description: string, metadata?: Record<string, any>) => {
    const log = addLog({
      type,
      status: 'pending',
      title,
      description,
      metadata
    });
    
    return log.id; // Return log ID for later updates
  }, [addLog]);

  // Track successful transaction
  const trackSuccess = useCallback((logId: string, txHash: string, blockNumber: number, gasUsed?: bigint) => {
    updateLog(logId, {
      status: 'success',
      txHash,
      blockNumber,
      gasUsed
    });
  }, [updateLog]);

  // Track failed transaction
  const trackFailure = useCallback((logId: string, error: string) => {
    updateLog(logId, {
      status: 'failed',
      error
    });
  }, [updateLog]);

  // Get logs by type
  const getLogsByType = useCallback((type: ActivityLog['type']) => {
    return logs.filter(log => log.type === type);
  }, [logs]);

  // Get logs by status
  const getLogsByStatus = useCallback((status: ActivityLog['status']) => {
    return logs.filter(log => log.status === status);
  }, [logs]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('activityLogs');
  }, []);

  // Get recent logs (last 24 hours)
  const getRecentLogs = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return logs.filter(log => log.timestamp > oneDayAgo);
  }, [logs]);

  // Get logs with time ago formatting
  const getFormattedLogs = useCallback(() => {
    return logs.map(log => ({
      ...log,
      timeAgo: formatDistanceToNow(log.timestamp, { addSuffix: true })
    }));
  }, [logs]);

  return {
    logs,
    isLoading,
    addLog,
    updateLog,
    trackTransaction,
    trackSuccess,
    trackFailure,
    getLogsByType,
    getLogsByStatus,
    getRecentLogs,
    getFormattedLogs,
    clearLogs
  };
} 