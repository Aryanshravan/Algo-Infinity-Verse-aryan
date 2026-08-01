import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const raftCode = fs.readFileSync(
  path.resolve(
    __dirname,
    '../pages/visualizers/raft-partition-simulator/raft-partition-simulator.js'
  ),
  'utf-8'
);

// Mock DOM elements
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    setLineDash: () => {},
  }),
  width: 800,
  height: 400,
  clientWidth: 800,
  clientHeight: 400,
  parentElement: { clientWidth: 800, clientHeight: 400 },
  addEventListener: () => {},
};

const mockDocument = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (id === 'raftCanvas') return mockCanvas;
    return {
      value: '1.0',
      addEventListener: () => {},
      innerHTML: '',
      className: '',
      classList: { add: () => {}, remove: () => {} },
      style: {},
      innerText: '',
      textContent: '',
      appendChild: () => {},
    };
  },
  querySelectorAll: () => [],
};

function loadModule() {
  const mockModule = { exports: {} };
  const fn = new Function('module', 'exports', 'document', 'window', 'raftCode', raftCode);
  fn(mockModule, mockModule.exports, mockDocument, { addEventListener: () => {} });
  return mockModule.exports;
}

describe('Raft Consensus Partition Simulator Unit Tests', () => {
  let mod;

  beforeEach(() => {
    mod = loadModule();
  });

  test('RaftNode initializes and handles transitions correctly', () => {
    const { RaftNode } = mod;
    const node = new RaftNode(1, 100, 100);

    expect(node.id).toBe(1);
    expect(node.state).toBe('Follower');
    expect(node.currentTerm).toBe(0);

    node.becomeCandidate();
    expect(node.state).toBe('Candidate');
    expect(node.currentTerm).toBe(1);
    expect(node.votedFor).toBe(1);

    node.becomeLeader(5);
    expect(node.state).toBe('Leader');
  });

  test('NetworkController manages partition state and drop behaviors', () => {
    const { NetworkController, RaftNode } = mod;
    const net = new NetworkController();

    const n1 = new RaftNode(1, 10, 10);
    const n2 = new RaftNode(2, 20, 20);
    const n3 = new RaftNode(3, 30, 30);
    net.nodes = [n1, n2, n3];

    // Fully connected
    expect(net.canCommunicate(1, 2)).toBe(true);
    expect(net.canCommunicate(1, 3)).toBe(true);

    // Partition A={1,2}, B={3,4,5}
    net.isPartitioned = true;
    expect(net.canCommunicate(1, 2)).toBe(true); // Same partition
    expect(net.canCommunicate(1, 3)).toBe(false); // Isolated partition
  });
});
