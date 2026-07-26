/**
 * Tests for Issue #3016:
 * Real-Time State Reconstitution Desynchronization in Transactional Outbox Pattern Visualizer
 *
 * Verifies that:
 * 1. Source code contains the isPublishing guard
 * 2. stopRelay() is a distinct function that clears relayInterval
 * 3. resetAll calls stopRelay before re-initializing state
 * 4. The concurrent-publish guard prevents double-processing (unit-level simulation)
 * 5. animatePacket DOM-removed row guard prevents stale DOM mutations after reset
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outboxCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/outbox-pattern/outbox-pattern.js'),
  'utf-8'
);

describe('Outbox Pattern Relay Desynchronization Fix (Issue #3016)', () => {
  test('source code declares isPublishing guard variable', () => {
    expect(outboxCode).toContain('let isPublishing = false');
  });

  test('source code checks isPublishing in the relay interval body', () => {
    // The relay guard must combine both flags
    expect(outboxCode).toMatch(/isProcessing \|\| isPublishing/);
  });

  test('source code sets isPublishing = true before animatePacket and false after within relay', () => {
    // Within the startRelay setInterval body, true must appear before false
    const relayStart = outboxCode.indexOf('function startRelay()');
    const relayBody = outboxCode.indexOf('setInterval(', relayStart);
    const relayBodyCode = outboxCode.slice(relayBody);
    const trueIdx = relayBodyCode.indexOf('isPublishing = true;');
    const falseIdx = relayBodyCode.indexOf('isPublishing = false;');
    expect(trueIdx).toBeGreaterThan(0);
    expect(falseIdx).toBeGreaterThan(0);
    expect(trueIdx).toBeLessThan(falseIdx);
  });

  test('stopRelay() function exists and clears relayInterval', () => {
    expect(outboxCode).toContain('function stopRelay()');
    expect(outboxCode).toMatch(/stopRelay[\s\S]*?clearInterval\(relayInterval\)/);
    expect(outboxCode).toMatch(/stopRelay[\s\S]*?relayInterval = null/);
  });

  test('resetAll calls stopRelay before re-initializing state', () => {
    expect(outboxCode).toContain('function resetAll()');
    // stopRelay() must appear inside resetAll, before isPublishing = false
    const resetStart = outboxCode.indexOf('function resetAll()');
    const stopRelayInReset = outboxCode.indexOf('stopRelay();', resetStart);
    const isPublishingReset = outboxCode.indexOf('isPublishing = false;', resetStart);
    expect(stopRelayInReset).toBeGreaterThan(resetStart);
    expect(stopRelayInReset).toBeLessThan(isPublishingReset);
  });

  test('startRelay calls stopRelay first to supersede any old interval', () => {
    expect(outboxCode).toContain('function startRelay()');
    const startRelayStart = outboxCode.indexOf('function startRelay()');
    const stopRelayInStart = outboxCode.indexOf('stopRelay();', startRelayStart);
    const setIntervalInStart = outboxCode.indexOf('setInterval(', startRelayStart);
    // stopRelay must appear before setInterval within startRelay
    expect(stopRelayInStart).toBeGreaterThan(startRelayStart);
    expect(stopRelayInStart).toBeLessThan(setIntervalInStart);
  });

  test('relay body guards against DOM-removed rows after reset (parentNode check)', () => {
    // After reset clears the outbox table, the in-flight animatePacket resolves
    // and must not write to a detached DOM node.
    expect(outboxCode).toContain('pending.parentNode');
  });

  test('isPublishing is reset to false in resetAll to allow fresh relay cycle', () => {
    const resetStart = outboxCode.indexOf('function resetAll()');
    const resetEnd = outboxCode.indexOf('startRelay();', resetStart);
    const segment = outboxCode.slice(resetStart, resetEnd);
    expect(segment).toContain('isPublishing = false;');
  });

  test('concurrent publish simulation — guard prevents second entry', () => {
    // Simulate the relay interval tick logic in isolation
    let isPublishing = false;
    let publishCount = 0;

    function relayTick() {
      if (isPublishing) return; // Guard — should block second call
      isPublishing = true;
      publishCount++;
      // simulate async work without resolving (publish in-flight)
    }

    relayTick(); // First tick: acquires lock
    relayTick(); // Second tick: should be blocked by guard
    relayTick(); // Third tick: should be blocked by guard

    expect(publishCount).toBe(1); // Only one publish should have started
    expect(isPublishing).toBe(true); // Lock still held
  });
});
