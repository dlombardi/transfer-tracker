## Design Notes

1. How you handle duplicate and out-of-order events
- **Duplicates (idempotency):** Each transfer tracks `seen_event_ids` (a Set of event IDs). When a new event for a transfer arrives, the service checks if its `event_id` is already in the set. If so, the event is treated as a duplicate, marked as such in the response, and has no effect on the transfer state. If not, the event is processed and the event ID is recorded.
- **Out-of-order events:** For each incoming event, its `timestamp` is compared against the transfer's last known update time. If the event is older than the current state (`timestamp` < current `last_updated`), the system still appends the event to the event history but does *not* update the main status fields. Instead, a warning is added of type `out_of_order`, and the transfer's status only advances if the new event is chronologically equal to or after the current state.

2. How you determine the current transfer status
- The canonical/current status for a transfer is kept in a state object. When a valid new event arrives whose timestamp is equal or later than the current `last_updated`, the transfer's `current_status` and `last_updated` are updated. Each event is evaluated using `validateTransition`, which can add warnings for invalid transitions (such as missing/illegal transitions or conflicting terminal states) but does not necessarily block updates if the provided event is valid by time and transition rules.

3. How you designed the API for the second consumer (contract, payload shape, tradeoffs)
- **Endpoints:**
  - `POST /events`: Accepts new transfer events. Returns whether the event was processed or was a duplicate, the transfer ID, and any validation warnings.
  - `GET /transfers`: Lists all transfer summaries (ID, status, is terminal, last updated, warning count).
  - `GET /transfers/:id`: Returns full details for a single transfer, including all events and warnings.
- **Payloads:** The event payload expects `transfer_id`, `event_id`, `status`, and a valid ISO timestamp. Responses always include warnings, which consumers can optionally show or log.
- **Tradeoffs:** This structure ensures strong idempotency and safety against out-of-order delivery, while surfacing issues via warnings rather than hard errors. Simple, explicit contracts allow easy debugging and integration for downstream consumers.

4. Key tradeoffs you made or considered
- **Idempotency vs. Simplicity:** Chose to enforce idempotency strictly using `event_id` for robust reprocessing and replay support.
- **Out-of-order arrivals:** Decided to allow out-of-order events to be recorded as part of the history but not affect the main status unless they are the latest, minimizing race-condition impact while preserving an audit trail.
- **Warning-based reporting rather than hard errors:** The system reports protocol violations (like out-of-order events, illegal transitions, or conflicting terminal states) via warnings in the response and transfer details, instead of hard-rejecting events, ensuring observability and debuggability.
- **Minimal in-memory "database":** Used a simple Map for tracking state, which is fast and easy to reset, but means there is no persistent storage (all state is lost on restart).
- **Open payload shape:** Kept payloads extensible for future fields (e.g., additional metadata).

## System Design Questions

1. Scaling and Evolution

**Storage Layer:**
- Replace in-memory Map with a persistent event store for event sourcing (PostgreSQL with event log table)
- Add a separate read model for queries (CQRS pattern) - current state in Redis or read-optimized DB

**Processing:**
- Move to message queue architecture (Kafka) for distributed eventing
- Process events asynchronously with worker pools/consumer groups
- Kafka partition by transfer_id hash to maintain per-transfer ordering while scaling

**Infrastructure:**
- Add caching layer (Redis) for hot transfer lookups and write-through cache update strategy with a TTL of 15 minutes (or something reasonable)
- Implement database sharding by transfer_id for write distribution with consistent hashing
- Use read replicas for query traffic
- Add observability to the system via datadog and alerting on failed transfers

**What I'd Keep:**
- Event sourcing pattern - replay capability for recovery and complete audit trail
- State machine with defined transitions - prevents invalid states
- Idempotency via event_id - already built for at-least-once delivery
- Warning-based validation - surfaces issues without blocking

2. Data Correction & Recovery

**How to Detect:**
- Monitor warning rates - spike in out_of_order, invalid_transition, or conflicting_terminal warnings signals state derivation issues
- Reconciliation job - periodically re-derive state from events, compare to stored state, alert on discrepancies
- Anomaly detection - alert if state distribution looks abnormal (e.g., sudden spike in failed transfers)

**How to Correct Safely:**
- Event sourcing makes this straightforward - events are source of truth, just replay them to rebuild correct state
- Run reconciliation in read-only mode first (detect, don't fix)
- Review discrepancies before applying fixes
- Apply during low-traffic window, keep backup of corrupted state for investigation

**How to Prevent Recurrence:**
- Add invariant assertions that derived state matches expected properties
- Property-based testing for state machine with random event sequences
- Schema versioning to catch breaking changes to event format

3. Correctness vs Freshness

**For real-time consumers:**
- Current design - events update state immediately
- Accept brief inconsistency during issues in exchange for speed
- Kafka partitioning provides ordering guarantees without explicit locking

**For correctness-critical consumers:**
- Add confirmed flag - only true after no conflicting events for N minutes
- Return confidence_level based on warning count and time since last update
- Provide query parameter: GET /transfers?confirmed_only=true

**What Changes If Real Money Safety Is Critical:**
- Events with warnings queued for manual review instead of processed
- Pessimistic locking (database row locks or distributed locks) to prevent race conditions
- Terminal states require minimum confirmation time before showing to users (could be 5 minutes)
- Circuit breaker halts processing if error rate exceeds threshold
- Human-in-the-loop approval for high-value transfers