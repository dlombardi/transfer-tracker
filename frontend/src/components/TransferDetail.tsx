import { TransferDetail as TransferDetailType } from '../types';
import { formatTime, getStatusBadgeClass } from '../utils';

interface TransferDetailProps {
  transfer: TransferDetailType | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
}

export function TransferDetail({
  transfer,
  loading,
  error,
  onBack,
  onRefresh,
}: TransferDetailProps) {
  if (loading) {
    return <div className="loading">Loading transfer details...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button className="btn-secondary" onClick={onBack}>
          Back to List
        </button>
      </div>
    );
  }

  if (!transfer) {
    return null;
  }

  return (
    <div>
      <div className="header">
        <span className="back-link" onClick={onBack}>
          &larr; Back to List
        </span>
        <button className="btn-primary" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="card">
        <h2>Transfer: {transfer.id}</h2>
        <p>
          <strong>Status:</strong>{' '}
          <span className={getStatusBadgeClass(transfer.current_status)}>
            {transfer.current_status}
          </span>
          {transfer.is_terminal && (
            <span className="badge badge-terminal" style={{ marginLeft: '8px' }}>
              Terminal
            </span>
          )}
        </p>
        <p>
          <strong>Last Updated:</strong> {formatTime(transfer.last_updated)}
        </p>
      </div>

      {transfer.warnings.length > 0 && (
        <div className="card">
          <h2>Warnings ({transfer.warnings.length})</h2>
          <ul className="warning-list">
            {transfer.warnings.map((warning, index) => (
              <li key={index} className="warning-item">
                <div className="warning-type">{warning.type}</div>
                <div>{warning.message}</div>
                <div className="timeline-time">
                  Event: {warning.event_id} | Detected: {formatTime(warning.detected_at)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Event Timeline ({transfer.events.length})</h2>
        <div className="timeline">
          {transfer.events.map((event, index) => (
            <div key={index} className="timeline-item">
              <div>
                <span className={getStatusBadgeClass(event.status)}>
                  {event.status}
                </span>
                {event.reason && (
                  <span style={{ marginLeft: '8px', color: '#c62828' }}>
                    Reason: {event.reason}
                  </span>
                )}
              </div>
              <div className="timeline-time">
                {formatTime(event.timestamp)} | Event ID: {event.event_id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
