import {
  TransferEvent,
  StoredTransfer,
  TransferListItem,
  TransferDetailResponse,
  Warning,
} from './types.js';
import { validateTransition, isTerminalState } from './state-machine.js';

const transfers = new Map<string, StoredTransfer>();

export function processEvent(event: TransferEvent): {
  processed: boolean;
  duplicate: boolean;
  transfer_id: string;
  warnings: Warning[];
} {
  const { transfer_id, event_id, status, timestamp } = event;

  let stored = transfers.get(transfer_id);

  if (!stored) {
    stored = {
      state: {
        transfer_id,
        current_status: status,
        is_terminal: isTerminalState(status),
        last_updated: timestamp,
        warnings: [],
      },
      events: [event],
      seen_event_ids: new Set([event_id]),
    };
    transfers.set(transfer_id, stored);

    return {
      processed: true,
      duplicate: false,
      transfer_id,
      warnings: [],
    };
  }

  if (stored.seen_event_ids.has(event_id)) {
    return {
      processed: false,
      duplicate: true,
      transfer_id,
      warnings: [],
    };
  }

  stored.seen_event_ids.add(event_id);
  stored.events.push(event);

  const validation = validateTransition(
    stored.state.current_status,
    status,
    stored.state.last_updated,
    timestamp,
    event_id
  );

  stored.state.warnings.push(...validation.warnings);

  if (new Date(timestamp) >= new Date(stored.state.last_updated)) {
    stored.state.current_status = status;
    stored.state.last_updated = timestamp;
    stored.state.is_terminal = isTerminalState(status);
  }

  return {
    processed: true,
    duplicate: false,
    transfer_id,
    warnings: validation.warnings,
  };
}

export function getAllTransfers(): TransferListItem[] {
  return Array.from(transfers.values())
    .map((stored) => ({
      id: stored.state.transfer_id,
      current_status: stored.state.current_status,
      is_terminal: stored.state.is_terminal,
      last_updated: stored.state.last_updated,
      warning_count: stored.state.warnings.length,
    }))
    .sort((a, b) =>
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    );
}

export function getTransferDetail(transferId: string): TransferDetailResponse | null {
  const stored = transfers.get(transferId);

  if (!stored) {
    return null;
  }

  const sortedEvents = [...stored.events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return {
    id: stored.state.transfer_id,
    current_status: stored.state.current_status,
    is_terminal: stored.state.is_terminal,
    last_updated: stored.state.last_updated,
    warnings: stored.state.warnings,
    events: sortedEvents,
  };
}

export function clearAllTransfers(): void {
  transfers.clear();
}

export function getTransferCount(): number {
  return transfers.size;
}
