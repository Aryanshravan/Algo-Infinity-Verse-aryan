// backend/services/webrtc.service.js

// ============================================
// CONSTANTS
// ============================================

const MAX_ROOM_SIZE = 10;
const ROOM_TIMEOUT_MS = 300000; // 5 minutes
const MAX_ROOM_ID_LENGTH = 100;
const MAX_USER_ID_LENGTH = 100;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate room ID
 * @param {any} roomId - Room ID to validate
 * @returns {Object} - { valid: boolean, error: string, value: string }
 */
function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
    return {
      valid: false,
      error: 'Room ID is required and must be a non-empty string.',
    };
  }

  const trimmed = roomId.trim();
  if (trimmed.length > MAX_ROOM_ID_LENGTH) {
    return {
      valid: false,
      error: `Room ID cannot exceed ${MAX_ROOM_ID_LENGTH} characters.`,
    };
  }

  // Check for invalid characters
  if (/[<>{}]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Room ID contains invalid characters.',
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate user ID
 * @param {any} userId - User ID to validate
 * @returns {Object} - { valid: boolean, error: string, value: string }
 */
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return {
      valid: false,
      error: 'User ID is required and must be a non-empty string.',
    };
  }

  const trimmed = userId.trim();
  if (trimmed.length > MAX_USER_ID_LENGTH) {
    return {
      valid: false,
      error: `User ID cannot exceed ${MAX_USER_ID_LENGTH} characters.`,
    };
  }

  // Check for invalid characters
  if (/[<>{}]/.test(trimmed)) {
    return {
      valid: false,
      error: 'User ID contains invalid characters.',
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate target socket ID
 * @param {any} targetSocketId - Socket ID to validate
 * @returns {Object} - { valid: boolean, error: string, value: string }
 */
function validateTargetSocketId(targetSocketId) {
  if (!targetSocketId || typeof targetSocketId !== 'string') {
    return {
      valid: false,
      error: 'Target socket ID is required and must be a string.',
    };
  }

  return { valid: true, value: targetSocketId };
}

/**
 * Validate offer/answer/candidate data
 * @param {any} data - Data to validate
 * @param {string} type - Type of data (offer/answer/candidate)
 * @returns {Object} - { valid: boolean, error: string, value: any }
 */
function validateSignalData(data, type) {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: `${type} must be a valid object.`,
    };
  }

  // Basic check for required fields
  if (type === 'offer' && !data.type && !data.sdp) {
    return {
      valid: false,
      error: 'Invalid offer: missing type or sdp.',
    };
  }

  if (type === 'answer' && !data.type && !data.sdp) {
    return {
      valid: false,
      error: 'Invalid answer: missing type or sdp.',
    };
  }

  if (type === 'candidate' && !data.candidate) {
    return {
      valid: false,
      error: 'Invalid candidate: missing candidate field.',
    };
  }

  return { valid: true, value: data };
}

// ============================================
// WEBRTC SERVICE CLASS
// ============================================

export class WebRTCService {
  constructor(options = {}) {
    this.rooms = new Map();
    this.peers = new Map();
    this.roomTimeouts = new Map();
    this.roomOpSequences = new Map();
    this.maxRoomSize = options.maxRoomSize || MAX_ROOM_SIZE;
    this.roomTimeout = options.roomTimeout || ROOM_TIMEOUT_MS;
  }

  /**
   * Get room name
   * @param {string} roomId - Room ID
   * @returns {string} - Room name
   */
  getRoomName(roomId) {
    return `webrtc-${roomId}`;
  }

  /**
   * Set room timeout for cleanup
   * @param {string} roomName - Room name
   */
  setRoomTimeout(roomName) {
    if (this.roomTimeouts.has(roomName)) {
      clearTimeout(this.roomTimeouts.get(roomName));
    }

    const timeout = setTimeout(() => {
      if (this.rooms.has(roomName) && this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
        console.log(`[WebRTC] Cleaned empty room: ${roomName}`);
      }
      this.roomTimeouts.delete(roomName);
    }, this.roomTimeout);

    this.roomTimeouts.set(roomName, timeout);
  }

  /**
   * Handle join room
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  handleJoin(socket, roomId, userId) {
    try {
      // Validate inputs
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }
      const validRoomId = roomValidation.value;

      const userValidation = validateUserId(userId);
      if (!userValidation.valid) {
        socket.emit('error', { message: userValidation.error });
        return;
      }
      const validUserId = userValidation.value;

      const roomName = this.getRoomName(validRoomId);

      // Check room size
      if (this.rooms.has(roomName)) {
        const room = this.rooms.get(roomName);
        if (room.size >= this.maxRoomSize) {
          socket.emit('error', {
            message: `Room is full. Maximum ${this.maxRoomSize} participants allowed.`,
          });
          return;
        }
        room.add(socket.id);
      } else {
        this.rooms.set(roomName, new Set([socket.id]));
        this.setRoomTimeout(roomName);
      }

      // Store peer info
      this.peers.set(socket.id, {
        userId: validUserId,
        roomId: roomName,
        joinedAt: Date.now(),
      });

      // Join room
      socket.join(roomName);

      // Notify others
      socket.to(roomName).emit('webrtc-user-joined', validUserId, socket.id);

      // Send room info to joining peer
      const room = this.rooms.get(roomName);
      const peers = Array.from(room)
        .filter((id) => id !== socket.id)
        .map((id) => ({
          socketId: id,
          userId: this.peers.get(id)?.userId || 'unknown',
        }));

      socket.emit('webrtc-room-info', {
        roomId: validRoomId,
        peers: peers,
        totalPeers: room.size,
      });

      console.log(`[WebRTC] User ${validUserId} joined room ${validRoomId} (${room.size} peers)`);
    } catch (error) {
      console.error('[WebRTC] Join error:', error);
      socket.emit('error', { message: 'Failed to join room.' });
    }
  }

  /**
   * Handle leave room
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  handleLeave(socket, roomId, userId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }
      const validRoomId = roomValidation.value;
      const roomName = this.getRoomName(validRoomId);

      socket.leave(roomName);

      if (this.rooms.has(roomName)) {
        this.rooms.get(roomName).delete(socket.id);
        if (this.rooms.get(roomName).size === 0) {
          this.setRoomTimeout(roomName);
        }
      }

      this.peers.delete(socket.id);

      socket.to(roomName).emit('webrtc-user-left', userId, socket.id);

      console.log(`[WebRTC] User ${userId} left room ${validRoomId}`);
    } catch (error) {
      console.error('[WebRTC] Leave error:', error);
      socket.emit('error', { message: 'Failed to leave room.' });
    }
  }

  /**
   * Handle WebRTC offer
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {Object} offer - Offer data
   * @param {string} targetSocketId - Target socket ID
   */
  handleOffer(socket, roomId, offer, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }

      const targetValidation = validateTargetSocketId(targetSocketId);
      if (!targetValidation.valid) {
        socket.emit('error', { message: targetValidation.error });
        return;
      }

      const signalValidation = validateSignalData(offer, 'offer');
      if (!signalValidation.valid) {
        socket.emit('error', { message: signalValidation.error });
        return;
      }

      socket.to(targetSocketId).emit('webrtc-offer', offer, socket.id);
    } catch (error) {
      console.error('[WebRTC] Offer error:', error);
      socket.emit('error', { message: 'Failed to send offer.' });
    }
  }

  /**
   * Handle WebRTC answer
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {Object} answer - Answer data
   * @param {string} targetSocketId - Target socket ID
   */
  handleAnswer(socket, roomId, answer, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }

      const targetValidation = validateTargetSocketId(targetSocketId);
      if (!targetValidation.valid) {
        socket.emit('error', { message: targetValidation.error });
        return;
      }

      const signalValidation = validateSignalData(answer, 'answer');
      if (!signalValidation.valid) {
        socket.emit('error', { message: signalValidation.error });
        return;
      }

      socket.to(targetSocketId).emit('webrtc-answer', answer, socket.id);
    } catch (error) {
      console.error('[WebRTC] Answer error:', error);
      socket.emit('error', { message: 'Failed to send answer.' });
    }
  }

  /**
   * Handle ICE candidate
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {Object} candidate - Candidate data
   * @param {string} targetSocketId - Target socket ID
   */
  handleIceCandidate(socket, roomId, candidate, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }

      const targetValidation = validateTargetSocketId(targetSocketId);
      if (!targetValidation.valid) {
        socket.emit('error', { message: targetValidation.error });
        return;
      }

      const signalValidation = validateSignalData(candidate, 'candidate');
      if (!signalValidation.valid) {
        socket.emit('error', { message: signalValidation.error });
        return;
      }

      socket.to(targetSocketId).emit('webrtc-ice-candidate', candidate, socket.id);
    } catch (error) {
      console.error('[WebRTC] ICE candidate error:', error);
      socket.emit('error', { message: 'Failed to send ICE candidate.' });
    }
  }

  /**
   * Handle screen sharing
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {boolean} enabled - Screen sharing enabled
   * @param {string} targetSocketId - Target socket ID
   */
  handleScreenShare(socket, roomId, enabled, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }

      const targetValidation = validateTargetSocketId(targetSocketId);
      if (!targetValidation.valid) {
        socket.emit('error', { message: targetValidation.error });
        return;
      }

      if (typeof enabled !== 'boolean') {
        socket.emit('error', { message: 'Screen share enabled must be a boolean.' });
        return;
      }

      socket.to(targetSocketId).emit('webrtc-screen-share', enabled, socket.id);
    } catch (error) {
      console.error('[WebRTC] Screen share error:', error);
      socket.emit('error', { message: 'Failed to toggle screen sharing.' });
    }
  }

  /**
   * Handle media control (audio/video toggle)
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {string} type - Media type (audio/video)
   * @param {boolean} enabled - Media enabled
   * @param {string} targetSocketId - Target socket ID
   */
  handleMediaControl(socket, roomId, type, enabled, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }

      const targetValidation = validateTargetSocketId(targetSocketId);
      if (!targetValidation.valid) {
        socket.emit('error', { message: targetValidation.error });
        return;
      }

      if (typeof enabled !== 'boolean') {
        socket.emit('error', { message: 'Media enabled must be a boolean.' });
        return;
      }

      if (type !== 'audio' && type !== 'video') {
        socket.emit('error', { message: 'Media type must be audio or video.' });
        return;
      }

      socket.to(targetSocketId).emit('webrtc-media-control', type, enabled, socket.id);
    } catch (error) {
      console.error('[WebRTC] Media control error:', error);
      socket.emit('error', { message: 'Failed to control media.' });
    }
  }

  /**
   * Handle socket disconnect
   * @param {Object} socket - Socket instance
   */
  handleDisconnect(socket) {
    try {
      const peerInfo = this.peers.get(socket.id);
      if (peerInfo) {
        const { roomId, userId } = peerInfo;
        if (this.rooms.has(roomId)) {
          this.rooms.get(roomId).delete(socket.id);
          if (this.rooms.get(roomId).size === 0) {
            this.setRoomTimeout(roomId);
          }
        }
        this.peers.delete(socket.id);
        socket.to(roomId).emit('webrtc-user-left', userId, socket.id);
        console.log(`[WebRTC] User ${userId} disconnected from room ${roomId}`);
      }
    } catch (error) {
      console.error('[WebRTC] Disconnect error:', error);
    }
  }

  /**
   * Get room info
   * @param {string} roomId - Room ID
   * @returns {Object} - Room information
   */
  getRoomInfo(roomId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        return { roomId, peers: [], size: 0, error: roomValidation.error };
      }

      const roomName = this.getRoomName(roomValidation.value);
      if (!this.rooms.has(roomName)) {
        return { roomId: roomValidation.value, peers: [], size: 0 };
      }

      const room = this.rooms.get(roomName);
      const peers = Array.from(room).map((socketId) => ({
        socketId,
        userId: this.peers.get(socketId)?.userId || 'unknown',
      }));

      return {
        roomId: roomValidation.value,
        peers,
        size: room.size,
        maxSize: this.maxRoomSize,
      };
    } catch (error) {
      console.error('[WebRTC] Get room info error:', error);
      return { roomId, peers: [], size: 0 };
    }
  }

  /**
   * Handle WebRTC OT operation with room sequence numbers and vector clocks
   * @param {Object} socket - Socket instance
   * @param {string} roomId - Room ID
   * @param {Object} opData - Operation payload
   * @param {string} targetSocketId - Target socket ID
   */
  handleOtOperation(socket, roomId, opData, targetSocketId) {
    try {
      const roomValidation = validateRoomId(roomId);
      if (!roomValidation.valid) {
        socket.emit('error', { message: roomValidation.error });
        return;
      }
      const validRoomId = roomValidation.value;
      const roomName = this.getRoomName(validRoomId);

      if (!opData || typeof opData !== 'object') {
        socket.emit('error', { message: 'Invalid OT operation payload.' });
        return;
      }

      const currentSeq = (this.roomOpSequences.get(roomName) || 0) + 1;
      this.roomOpSequences.set(roomName, currentSeq);

      const enrichedOp = {
        ...opData,
        opSeq: currentSeq,
        senderSocketId: socket.id,
        timestamp: Date.now(),
      };

      if (targetSocketId) {
        const targetValidation = validateTargetSocketId(targetSocketId);
        if (targetValidation.valid) {
          socket.to(targetSocketId).emit('webrtc-ot-operation', enrichedOp, socket.id);
        }
      } else {
        socket.to(roomName).emit('webrtc-ot-operation', enrichedOp, socket.id);
      }
    } catch (error) {
      console.error('[WebRTC] OT operation error:', error);
      socket.emit('error', { message: 'Failed to process OT operation.' });
    }
  }

  /**
   * Setup WebRTC signaling for socket
   * @param {Object} socket - Socket instance
   */
  setup(socket) {
    // Join room
    socket.on('webrtc-join', (roomId, userId) => {
      this.handleJoin(socket, roomId, userId);
    });

    // Leave room
    socket.on('webrtc-leave', (roomId, userId) => {
      this.handleLeave(socket, roomId, userId);
    });

    // Signaling
    socket.on('webrtc-offer', (roomId, offer, targetSocketId) => {
      this.handleOffer(socket, roomId, offer, targetSocketId);
    });

    socket.on('webrtc-answer', (roomId, answer, targetSocketId) => {
      this.handleAnswer(socket, roomId, answer, targetSocketId);
    });

    socket.on('webrtc-ice-candidate', (roomId, candidate, targetSocketId) => {
      this.handleIceCandidate(socket, roomId, candidate, targetSocketId);
    });

    // OT operations
    socket.on('webrtc-ot-operation', (roomId, opData, targetSocketId) => {
      this.handleOtOperation(socket, roomId, opData, targetSocketId);
    });

    // Screen sharing
    socket.on('webrtc-screen-share', (roomId, enabled, targetSocketId) => {
      this.handleScreenShare(socket, roomId, enabled, targetSocketId);
    });

    // Media controls
    socket.on('webrtc-media-control', (roomId, type, enabled, targetSocketId) => {
      this.handleMediaControl(socket, roomId, type, enabled, targetSocketId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let defaultWebRTCService = null;

/**
 * Get or create default WebRTC service
 * @param {Object} options - Service options
 * @returns {WebRTCService} - WebRTC service instance
 */
export function getWebRTCService(options = {}) {
  if (!defaultWebRTCService) {
    defaultWebRTCService = new WebRTCService(options);
  }
  return defaultWebRTCService;
}

/**
 * Attaches WebRTC signaling event handlers to a socket instance.
 * @param {import("socket.io").Socket} socket - The connected socket
 * @param {Object} options - Service options
 */
export function setupWebRTCSignaling(socket, options = {}) {
  const service = getWebRTCService(options);
  service.setup(socket);
  return service;
}

// ============================================
// EXPORTS
// ============================================

export default {
  WebRTCService,
  getWebRTCService,
  setupWebRTCSignaling,
};
