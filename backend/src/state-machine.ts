import {
  TransferStatus,
  Warning,
  TransitionCheckParams,
  ValidateTransitionParams,
} from './types.js';

const VALID_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  initiated: ['processing', 'failed'],
  processing: ['settled', 'failed'],
  settled: [],
  failed: [],
};

const TERMINAL_STATES: TransferStatus[] = ['settled', 'failed'];

export function isTerminalState(status: TransferStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

export function isValidTransition({ from, to }: TransitionCheckParams): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export interface TransitionValidationResult {
  warnings: Warning[];
}

export function validateTransition({
  currentStatus,
  newStatus,
  currentTimestamp,
  newTimestamp,
  eventId,
}: ValidateTransitionParams): TransitionValidationResult {
  const warnings: Warning[] = [];
  const now = new Date().toISOString();

  if (new Date(newTimestamp) < new Date(currentTimestamp)) {
    warnings.push({
      type: 'out_of_order',
      message: `Event timestamp ${newTimestamp} is earlier than current state timestamp ${currentTimestamp}`,
      event_id: eventId,
      detected_at: now,
    });
  }

  if (isTerminalState(currentStatus) && isTerminalState(newStatus) && currentStatus !== newStatus) {
    warnings.push({
      type: 'conflicting_terminal',
      message: `Transfer already ${currentStatus} but received ${newStatus}`,
      event_id: eventId,
      detected_at: now,
    });
  }

  if (!isValidTransition({ from: currentStatus, to: newStatus }) &&
      !(isTerminalState(currentStatus) && isTerminalState(newStatus))) {
    warnings.push({
      type: 'invalid_transition',
      message: `Invalid transition from ${currentStatus} to ${newStatus}`,
      event_id: eventId,
      detected_at: now,
    });
  }

  return { warnings };
}
