import { useState, useEffect, useCallback } from 'react';
import { TransferListItem, TransferDetail } from '../types';

const API_BASE = '/api';

export function useTransferList() {
  const [transfers, setTransfers] = useState<TransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/transfers`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTransfers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return {
    transfers,
    loading,
    error,
    refresh: fetchTransfers,
  };
}

export function useTransferDetail(transferId: string | null) {
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!transferId) {
      setTransfer(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/transfers/${transferId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transfer not found');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTransfer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfer');
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    transfer,
    loading,
    error,
    refresh: fetchDetail,
  };
}
