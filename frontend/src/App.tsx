import { useState, useEffect } from 'react';
import { TransferList } from './components/TransferList';
import { TransferDetail } from './components/TransferDetail';
import { useTransferList, useTransferDetail } from './hooks/useTransfers';

const POLL_INTERVAL = 10000;

function App() {
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  const {
    transfers,
    loading: listLoading,
    error: listError,
    refresh: refreshList,
  } = useTransferList();

  const {
    transfer: selectedTransfer,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useTransferDetail(selectedTransferId);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTransferId) {
        refreshDetail();
      } else {
        refreshList();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [selectedTransferId, refreshList, refreshDetail]);

  const handleSelectTransfer = (id: string) => {
    setSelectedTransferId(id);
  };

  const handleBack = () => {
    setSelectedTransferId(null);
    refreshList();
  };

  return (
    <div className="container">
      <h1>Transfer Tracker</h1>

      {selectedTransferId ? (
        <TransferDetail
          transfer={selectedTransfer}
          loading={detailLoading}
          error={detailError}
          onBack={handleBack}
          onRefresh={refreshDetail}
        />
      ) : (
        <TransferList
          transfers={transfers}
          loading={listLoading}
          error={listError}
          onSelectTransfer={handleSelectTransfer}
          onRefresh={refreshList}
        />
      )}
    </div>
  );
}

export default App;
