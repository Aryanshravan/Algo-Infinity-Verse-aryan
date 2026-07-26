import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rmqCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/rabbitmq-visualizer/rabbitmq-visualizer.js'),
  'utf-8'
);

describe('RabbitMQ Visualizer - AMQP Topic Tokenization & Routing Inspector', () => {
  let matchTopic;
  let matchTopicWithBreakdown;
  let matchHeadersWithBreakdown;
  let matchDirectWithBreakdown;

  beforeAll(() => {
    const mockModule = { exports: {} };
    const evalFunc = new Function('module', 'exports', 'document', 'window', rmqCode);
    evalFunc(mockModule, mockModule.exports, { addEventListener: () => {} }, {});

    matchTopic = mockModule.exports.matchTopic;
    matchTopicWithBreakdown = mockModule.exports.matchTopicWithBreakdown;
    matchHeadersWithBreakdown = mockModule.exports.matchHeadersWithBreakdown;
    matchDirectWithBreakdown = mockModule.exports.matchDirectWithBreakdown;
  });

  test('matchTopic matches exact topic keys correctly', () => {
    expect(matchTopic('orders.created', 'orders.created')).toBe(true);
    expect(matchTopic('orders.created', 'orders.updated')).toBe(false);
  });

  test('matchTopic matches single-word wildcard * correctly', () => {
    expect(matchTopic('logs.*.error', 'logs.europe.error')).toBe(true);
    expect(matchTopic('logs.*.error', 'logs.europe.warning')).toBe(false);
    expect(matchTopic('logs.*.error', 'logs.europe.us.error')).toBe(false);
  });

  test('matchTopic matches multi-word wildcard # correctly', () => {
    expect(matchTopic('logs.#', 'logs.europe.error')).toBe(true);
    expect(matchTopic('logs.#', 'logs')).toBe(true);
    expect(matchTopic('logs.#', 'orders.created')).toBe(false);
    expect(matchTopic('#', 'anything.here')).toBe(true);
  });

  test('matchTopicWithBreakdown provides detailed tokenization breakdown for * wildcard', () => {
    const result = matchTopicWithBreakdown('logs.*.error', 'logs.europe.error');
    expect(result.matched).toBe(true);
    expect(result.keyTokens).toEqual(['logs', 'europe', 'error']);
    expect(result.patternTokens).toEqual(['logs', '*', 'error']);
    expect(result.steps.length).toBeGreaterThan(0);

    const starStep = result.steps.find((s) => s.patternToken === '*');
    expect(starStep).toBeDefined();
    expect(starStep.matched).toBe(true);
    expect(starStep.keyToken).toBe('europe');
  });

  test('matchTopicWithBreakdown fails correctly on token mismatch', () => {
    const result = matchTopicWithBreakdown('logs.*.error', 'logs.europe.info');
    expect(result.matched).toBe(false);
    expect(result.keyTokens).toEqual(['logs', 'europe', 'info']);
    expect(result.patternTokens).toEqual(['logs', '*', 'error']);
  });

  test('matchHeadersWithBreakdown evaluates x-match all and any correctly', () => {
    const msgHeaders = { format: 'pdf', type: 'invoice' };
    const bindingHeaders = { format: 'pdf', type: 'invoice' };

    const allMatch = matchHeadersWithBreakdown(msgHeaders, bindingHeaders, 'all');
    expect(allMatch.matched).toBe(true);
    expect(allMatch.comparisons.length).toBe(2);

    const partialMsg = { format: 'pdf', type: 'receipt' };
    const allFail = matchHeadersWithBreakdown(partialMsg, bindingHeaders, 'all');
    expect(allFail.matched).toBe(false);

    const anyPass = matchHeadersWithBreakdown(partialMsg, bindingHeaders, 'any');
    expect(anyPass.matched).toBe(true);
  });

  test('matchDirectWithBreakdown performs exact string comparison', () => {
    const match = matchDirectWithBreakdown('orders.created', 'orders.created');
    expect(match.matched).toBe(true);

    const noMatch = matchDirectWithBreakdown('orders.created', 'orders.deleted');
    expect(noMatch.matched).toBe(false);
  });

  test('rabbitmq-visualizer.js includes MAX_HOP_COUNT and clearAllRetryTimers to break dead-letter loops', () => {
    const freshCode = fs.readFileSync(
      path.resolve(__dirname, '../pages/visualizers/rabbitmq-visualizer/rabbitmq-visualizer.js'),
      'utf-8'
    );
    expect(freshCode).toContain('MAX_HOP_COUNT');
    expect(freshCode).toContain('clearAllRetryTimers');
    expect(freshCode).toContain('activeRetryTimers');
  });
});
