export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'existing-user' | 'user-left';
  data?: any;
  roomId?: string;
  clientId?: string;
  clientName?: string;
  targetId?: string;
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  remoteStream?: MediaStream;
}

export class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private websocket: WebSocket | null = null;
  private roomId: string | null = null;
  private clientId: string;
  
  // Event callbacks
  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (clientId: string, stream: MediaStream) => void;
  public onUserJoined?: (clientId: string, clientName?: string) => void;
  public onExistingUser?: (clientId: string, clientName?: string) => void;
  public onUserLeft?: (clientId: string) => void;
  public onConnectionStateChange?: (clientId: string, state: RTCPeerConnectionState) => void;

  // ICE servers configuration
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor() {
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async initializeLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio
      });

      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  connectToSignalingServer(serverUrl: string = 'ws://localhost:8080/ws'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        console.log('Connected to signaling server');
        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        const message: SignalingMessage = JSON.parse(event.data);
        this.handleSignalingMessage(message);
      };

      this.websocket.onclose = () => {
        console.log('Disconnected from signaling server');
        // Implement reconnection logic here
      };
    });
  }

  async joinRoom(roomId: string, userName: string): Promise<void> {
    this.roomId = roomId;

    if (!this.websocket) {
      throw new Error('Not connected to signaling server');
    }

    const message: SignalingMessage = {
      type: 'join-room',
      roomId: roomId,
      clientId: this.clientId,
      clientName: userName
    };

    this.websocket.send(JSON.stringify(message));
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    console.log('Received signaling message:', message);
    console.log('Message type:', message.type, 'ClientID:', message.clientId, 'ClientName:', message.clientName);

    switch (message.type) {
      case 'existing-user':
        if (message.clientId && message.clientId !== this.clientId) {
          if (this.onExistingUser) {
            this.onExistingUser(message.clientId, message.clientName);
          }
        }
        break;

      case 'user-joined':
        if (message.clientId && message.clientId !== this.clientId) {
          await this.createOffer(message.clientId);
          if (this.onUserJoined) {
            this.onUserJoined(message.clientId, message.clientName);
          }
        }
        break;

      case 'offer':
        if (message.clientId && message.data) {
          await this.handleOffer(message.clientId, message.data);
        }
        break;

      case 'answer':
        if (message.clientId && message.data) {
          await this.handleAnswer(message.clientId, message.data);
        }
        break;

      case 'ice-candidate':
        if (message.clientId && message.data) {
          await this.handleIceCandidate(message.clientId, message.data);
        }
        break;

      case 'user-left':
        if (message.clientId) {
          this.removePeerConnection(message.clientId);
          if (this.onUserLeft) {
            this.onUserLeft(message.clientId);
          }
        }
        break;
    }
  }

  private createPeerConnection(clientId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log('Received remote stream from', clientId);
      
      const peerConn = this.peerConnections.get(clientId);
      if (peerConn) {
        peerConn.remoteStream = remoteStream;
      }

      if (this.onRemoteStream) {
        this.onRemoteStream(clientId, remoteStream);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.websocket) {
        const message: SignalingMessage = {
          type: 'ice-candidate',
          data: event.candidate,
          roomId: this.roomId!,
          clientId: this.clientId,
          targetId: clientId
        };
        this.websocket.send(JSON.stringify(message));
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${clientId}:`, peerConnection.connectionState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(clientId, peerConnection.connectionState);
      }
    };

    const peerConnectionObj: PeerConnection = {
      id: clientId,
      connection: peerConnection
    };

    this.peerConnections.set(clientId, peerConnectionObj);
    return peerConnection;
  }

  private async createOffer(clientId: string): Promise<void> {
    const peerConnection = this.createPeerConnection(clientId);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.websocket) {
        const message: SignalingMessage = {
          type: 'offer',
          data: offer,
          roomId: this.roomId!,
          clientId: this.clientId,
          targetId: clientId
        };
        this.websocket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private async handleOffer(clientId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.createPeerConnection(clientId);

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.websocket) {
        const message: SignalingMessage = {
          type: 'answer',
          data: answer,
          roomId: this.roomId!,
          clientId: this.clientId,
          targetId: clientId
        };
        this.websocket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(clientId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(clientId)?.connection;
    
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  private async handleIceCandidate(clientId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(clientId)?.connection;
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  private removePeerConnection(clientId: string): void {
    const peerConnection = this.peerConnections.get(clientId);
    if (peerConnection) {
      peerConnection.connection.close();
      this.peerConnections.delete(clientId);
    }
  }

  // Media controls
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return videoTracks[0]?.enabled || false;
    }
    return false;
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return audioTracks[0]?.enabled || false;
    }
    return false;
  }

  leaveRoom(): void {
    if (this.websocket && this.roomId) {
      const message: SignalingMessage = {
        type: 'leave-room',
        roomId: this.roomId,
        clientId: this.clientId
      };
      this.websocket.send(JSON.stringify(message));
    }

    // Close all peer connections
    this.peerConnections.forEach(peer => {
      peer.connection.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close websocket
    if (this.websocket) {
      this.websocket.close();
    }

    this.roomId = null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getPeerConnections(): Map<string, PeerConnection> {
    return this.peerConnections;
  }
}