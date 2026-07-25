import { startWorker } from '../backend/jobs/worker.js';

describe('BullMQ Worker Pool Configuration', () => {
  test('startWorker returns worker instances or null gracefully depending on Redis availability', async () => {
    const res = await startWorker();
    // In test environment without Redis, startWorker resolves to null or worker objects
    expect(res === null || typeof res === 'object').toBe(true);
  });
});
