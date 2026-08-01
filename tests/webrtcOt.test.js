import { WebRTCService } from '../backend/services/webrtc.service.js';

describe('WebRTC Service - Operational Transformation Sequence Ordering', () => {
  let service;
  let mockSocket;
  let emittedEvents;

  beforeEach(() => {
    service = new WebRTCService();
    emittedEvents = [];
    mockSocket = {
      id: 'socket-1',
      emit: (event, data) => emittedEvents.push({ target: 'self', event, data }),
      to: () => ({
        emit: (event, data, senderId) =>
          emittedEvents.push({ target: 'room', event, data, senderId }),
      }),
      join: () => {},
      leave: () => {},
    };
  });

  test('handleOtOperation assigns monotonically increasing sequence numbers per room', () => {
    const op1 = { type: 'insert', index: 0, text: 'a' };
    const op2 = { type: 'insert', index: 1, text: 'b' };

    service.handleOtOperation(mockSocket, 'room-1', op1);
    service.handleOtOperation(mockSocket, 'room-1', op2);

    expect(emittedEvents.length).toBe(2);
    expect(emittedEvents[0].data.opSeq).toBe(1);
    expect(emittedEvents[1].data.opSeq).toBe(2);
    expect(emittedEvents[0].data.senderSocketId).toBe('socket-1');
  });

  test('handleOtOperation rejects invalid op payloads gracefully', () => {
    service.handleOtOperation(mockSocket, 'room-1', null);
    expect(emittedEvents[0].event).toBe('error');
    expect(emittedEvents[0].data.message).toContain('Invalid OT operation payload');
  });
});
