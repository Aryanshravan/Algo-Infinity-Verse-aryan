import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/cqrs-visualizer/cqrs-visualizer.js'),
  'utf-8'
);

describe('CQRS Event Sourcing and Snapshotting', () => {
  let mockDocument;
  let mockEls;
  let cqrsModule;

  beforeEach(() => {
    mockEls = {
      commandType: { value: 'CreateUser' },
      commandPayload: { value: 'name: Alice' },
      btnSubmitCommand: { addEventListener: jest.fn() },
      eventLog: { appendChild: jest.fn(), scrollTop: 0, scrollHeight: 100 },
      eventLogEmpty: { style: {} },
      busFlowTrack: { appendChild: jest.fn() },
      busLag: { textContent: '' },
      jsonProjection: { innerHTML: '' },
      btnRunQuery: { addEventListener: jest.fn() },
      queryResult: { className: '', innerHTML: '' },
      btnReplay: { addEventListener: jest.fn() },
      btnTakeSnapshot: {
        addEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        innerHTML: '',
      },
      jsonSnapshot: { innerHTML: '' },
      engineBadge: { classList: { add: jest.fn(), remove: jest.fn() } },
      consistencyStatus: { textContent: '' },
    };

    mockDocument = {
      getElementById: (id) => mockEls[id],
      createElement: () => ({ className: '', innerHTML: '', remove: jest.fn() }),
      addEventListener: jest.fn(),
    };

    const fn = new Function(
      'document',
      'window',
      'setTimeout',
      'setInterval',
      'clearInterval',
      `
        const module = { exports: {} };
        ${scriptCode}
        module.exports = {
          EventStore,
          getSnapshot: () => Snapshot,
          getCurrentProjection: () => CurrentProjection,
          handleCommand,
          takeSnapshot,
          replayEvents,
          processMessageBus,
          applyToProjection
        };
        return module.exports;
      `
    );

    // Mock Date.now for unique event IDs
    let time = 1000;
    global.Date.now = jest.fn(() => time++);

    cqrsModule = fn(
      mockDocument,
      { addEventListener: () => {} },
      setTimeout,
      setInterval,
      clearInterval
    );
  });

  test('Snapshot captures current state', () => {
    // 1. Send command
    cqrsModule.handleCommand();

    // Simulate event bus processing
    cqrsModule.processMessageBus(); // shifts from bus
    // Since setTimeout is used in processMessageBus for 1s, we'll manually apply the event
    cqrsModule.applyToProjection(cqrsModule.EventStore[0]);

    expect(cqrsModule.getCurrentProjection().name).toBe('Alice');
    expect(cqrsModule.getCurrentProjection().version).toBe(1);

    // 2. Take Snapshot
    cqrsModule.takeSnapshot();
    const snapshot = cqrsModule.getSnapshot();

    expect(snapshot.name).toBe('Alice');
    expect(snapshot.version).toBe(1);
    expect(mockEls.jsonSnapshot.innerHTML).toContain('Alice');
  });

  test('Replay starts from snapshot if it exists', () => {
    // 1. Initial State
    cqrsModule.handleCommand(); // Create Alice (v1)
    cqrsModule.applyToProjection(cqrsModule.EventStore[0]);

    cqrsModule.takeSnapshot(); // Snapshot at v1

    // 2. More events
    mockEls.commandType.value = 'UpdateEmail';
    mockEls.commandPayload.value = 'email: alice@test.com';
    cqrsModule.handleCommand(); // Update email (v2)
    cqrsModule.applyToProjection(cqrsModule.EventStore[1]);

    expect(cqrsModule.getCurrentProjection().email).toBe('alice@test.com');
    expect(cqrsModule.getCurrentProjection().version).toBe(2);

    // 3. Replay
    // Before replay, let's mess up the projection to prove replay fixes it
    cqrsModule.getCurrentProjection().email = 'wrong';
    cqrsModule.replayEvents();

    // The projection should be reset to the SNAPSHOT state synchronously (v1)
    expect(cqrsModule.getCurrentProjection().name).toBe('Alice');
    expect(cqrsModule.getCurrentProjection().version).toBe(1);

    // The event bus would process the remaining events (v2) asynchronously
    // We can manually apply it to simulate the bus
    cqrsModule.applyToProjection(cqrsModule.EventStore[1]);
    expect(cqrsModule.getCurrentProjection().email).toBe('alice@test.com');
    expect(cqrsModule.getCurrentProjection().version).toBe(2);
  });
});
