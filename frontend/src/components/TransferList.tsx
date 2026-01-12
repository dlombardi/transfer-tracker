import { TransferListItem } from '../types';
import { formatTime, getStatusBadgeClass } from '../utils';

interface TransferListProps {
  transfers: TransferListItem[];
  loading: boolean;
  error: string | null;
  onSelectTransfer: (id: string) => void;
  onRefresh: () => void;
}

export function TransferList({
  transfers,
  loading,
  error,
  onSelectTransfer,
  onRefresh,
}: TransferListProps) {
  if (loading) {
    return <div className="loading">Loading transfers...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button className="btn-primary" onClick={onRefresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h2>All Transfers ({transfers.length})</h2>
        <button className="btn-primary" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {transfers.length === 0 ? (
        <div className="card">
          <p>No transfers yet. Send events to POST /events to create transfers.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Transfer ID</th>
              <th>Status</th>
              <th>Terminal</th>
              <th>Last Updated</th>
              <th>Warnings</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => (
              <tr
                key={transfer.id}
                className="clickable"
                onClick={() => onSelectTransfer(transfer.id)}
              >
                <td>
                  <code>{transfer.id}</code>
                </td>
                <td>
                  <span className={getStatusBadgeClass(transfer.current_status)}>
                    {transfer.current_status}
                  </span>
                </td>
                <td>
                  {transfer.is_terminal && (
                    <span className="badge badge-terminal">Terminal</span>
                  )}
                </td>
                <td>{formatTime(transfer.last_updated)}</td>
                <td>
                  {transfer.warning_count > 0 && (
                    <span className="badge badge-warning">
                      {transfer.warning_count} warning{transfer.warning_count > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
