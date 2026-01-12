import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { TransferEvent } from './types.js';
import { processEvent, getAllTransfers, getTransferDetail } from './events.js';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'transfer-tracker' });
});

app.post('/events', async (c) => {
  try {
    const body = await c.req.json<TransferEvent>();

    if (!body.transfer_id || !body.event_id || !body.status || !body.timestamp) {
      return c.json(
        { error: 'Missing required fields: transfer_id, event_id, status, timestamp' },
        400
      );
    }

    const validStatuses = ['initiated', 'processing', 'settled', 'failed'];
    if (!validStatuses.includes(body.status)) {
      return c.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        400
      );
    }

    if (isNaN(Date.parse(body.timestamp))) {
      return c.json({ error: 'Invalid timestamp format. Use ISO 8601.' }, 400);
    }

    const result = processEvent(body);

    if (result.duplicate) {
      return c.json({
        status: 'duplicate',
        message: 'Event already processed',
        transfer_id: result.transfer_id,
      });
    }

    return c.json({
      status: 'processed',
      transfer_id: result.transfer_id,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error processing event:', error);
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

app.get('/transfers', (c) => {
  const transfers = getAllTransfers();
  return c.json(transfers);
});

app.get('/transfers/:id', (c) => {
  const id = c.req.param('id');
  const detail = getTransferDetail(id);

  if (!detail) {
    return c.json({ error: 'Transfer not found' }, 404);
  }

  return c.json(detail);
});

const port = parseInt(process.env.PORT || '3001');

serve({
  fetch: app.fetch,
  port,
});

console.log(`Transfer Tracker API running on http://localhost:${port}`);
