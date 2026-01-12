export type TransferStatus = 'initiated' | 'processing' | 'settled' | 'failed';

export type WarningType = 'missing_transition' | 'conflicting_terminal' | 'out_of_order';

export interface TransferListItem {
  id: string;
  current_status: TransferStatus;
  is_terminal: boolean;
  last_updated: string;
  warning_count: number;
}

export interface Warning {
  type: WarningType;
  message: string;
  event_id: string;
  detected_at: string;
}

export interface TransferEvent {
  transfer_id: string;
  event_id: string;
  status: TransferStatus;
  timestamp: string;
  reason?: string;
}

export interface TransferDetail {
  id: string;
  current_status: TransferStatus;
  is_terminal: boolean;
  last_updated: string;
  warnings: Warning[];
  events: TransferEvent[];
}
