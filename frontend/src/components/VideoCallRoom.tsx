import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCService } from '../services/WebRTCService';
import VideoPlayer from './VideoPlayer';
import ControlPanel from './ControlPanel';
import ParticipantsList from './ParticipantsList';
import { Button } from './ui/button';

interface VideoCallRoomProps {
  roomId: string;
  userName: string;
  onLeaveRoom: () => void;
}

interface Participant {
  id: string;
  name?: string;
  stream?: MediaStream;
  isLocal?: boolean;
  connectionState?: RTCPeerConnectionState;
}

const VideoCallRoom: React.FC<VideoCallRoomProps> = ({ roomId, userName, onLeaveRoom }) => {
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const webrtcServiceRef = useRef<WebRTCService | null>(null);

  const initializeWebRTC = useCallback(async () => {
    // Prevent multiple initializations
    if (webrtcServiceRef.current) {
      console.log('WebRTC service already initialized, skipping...');
      return;
    }

    try {
      console.log('Initializing WebRTC service...');
      const webrtcService = new WebRTCService();
      webrtcServiceRef.current = webrtcService;

      // Set up event handlers
      webrtcService.onLocalStream = (stream: MediaStream) => {
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.set('local', {
            id: 'local',
            name: userName,
            stream,
            isLocal: true
          });
          return updated;
        });
      };

      webrtcService.onRemoteStream = (clientId: string, stream: MediaStream) => {
        console.log('Received remote stream from:', clientId);
        setParticipants(prev => {
          const updated = new Map(prev);
          const existingParticipant = updated.get(clientId);
          updated.set(clientId, {
            id: clientId,
            name: existingParticipant?.name, // Preserve existing name
            stream,
            isLocal: false,
            connectionState: existingParticipant?.connectionState
          });
          console.log('Updated participant with stream:', updated.get(clientId));
          return updated;
        });
      };

      webrtcService.onExistingUser = (clientId: string, clientName?: string) => {
        console.log('Existing user found:', clientId, clientName);
        setParticipants(prev => {
          const updated = new Map(prev);
          if (!updated.has(clientId)) {
            console.log('Adding existing participant:', clientId, clientName);
            updated.set(clientId, {
              id: clientId,
              name: clientName,
              isLocal: false
            });
          }
          return updated;
        });
      };

      webrtcService.onUserJoined = (clientId: string, clientName?: string) => {
        console.log('New user joined:', clientId, clientName);
        setParticipants(prev => {
          console.log('Current participants before adding:', Array.from(prev.keys()));
          const updated = new Map(prev);
          if (!updated.has(clientId)) {
            console.log('Adding new participant:', clientId, clientName);
            updated.set(clientId, {
              id: clientId,
              name: clientName,
              isLocal: false
            });
          } else {
            console.log('Participant already exists:', clientId);
          }
          console.log('Participants after update:', Array.from(updated.keys()));
          return updated;
        });
      };

      webrtcService.onUserLeft = (clientId: string) => {
        console.log('User left:', clientId);
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.delete(clientId);
          return updated;
        });
      };

      webrtcService.onConnectionStateChange = (clientId: string, state: RTCPeerConnectionState) => {
        console.log(`Connection state with ${clientId}:`, state);
        setParticipants(prev => {
          const updated = new Map(prev);
          const participant = updated.get(clientId);
          if (participant) {
            updated.set(clientId, {
              ...participant,
              connectionState: state
            });
          }
          return updated;
        });
      };

      // Initialize local stream
      await webrtcService.initializeLocalStream(true, true);
      
      // Connect to signaling server
      await webrtcService.connectToSignalingServer();
      setConnectionStatus('connected');
      
      // Join room
      await webrtcService.joinRoom(roomId, userName);

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setError('Failed to access camera and microphone. Please check permissions.');
      setConnectionStatus('disconnected');
    }
  }, [roomId, userName]);

  useEffect(() => {
    initializeWebRTC();

    return () => {
      if (webrtcServiceRef.current) {
        console.log('Cleaning up WebRTC service...');
        webrtcServiceRef.current.leaveRoom();
        webrtcServiceRef.current = null;
      }
      // Clear participants when leaving
      setParticipants(new Map());
    };
  }, [initializeWebRTC]);

  const handleToggleVideo = useCallback(() => {
    if (webrtcServiceRef.current) {
      const enabled = webrtcServiceRef.current.toggleVideo();
      setIsVideoEnabled(enabled);
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (webrtcServiceRef.current) {
      const enabled = webrtcServiceRef.current.toggleAudio();
      setIsAudioEnabled(enabled);
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.leaveRoom();
    }
    onLeaveRoom();
  }, [onLeaveRoom]);

  const participantsArray = Array.from(participants.values());
  const localParticipant = participantsArray.find(p => p.isLocal);
  const remoteParticipants = participantsArray.filter(p => !p.isLocal);

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white justify-center items-center">
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-red-500 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top bar like Google Meet */}
      <div className="flex justify-between items-center p-4 bg-white text-gray-900 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-medium">Meet</span>
          </div>
          <div className="text-sm text-gray-600">
            {roomId}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'disconnected' && 'Connection lost'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-gray-600 hover:text-gray-900"
          >
            Leave call
          </Button>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        {remoteParticipants.length > 0 ? (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {/* Remote participants */}
            {remoteParticipants.map(participant => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <VideoPlayer
                  stream={participant.stream}
                  isLocal={false}
                  participantId={participant.name || participant.id}
                  connectionState={participant.connectionState}
                />
              </div>
            ))}
            {/* Local video */}
            {localParticipant?.stream && (
              <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <VideoPlayer
                  stream={localParticipant.stream}
                  isLocal={true}
                  participantId={localParticipant.name || "You"}
                  muted={true}
                  isVideoEnabled={isVideoEnabled}
                />
              </div>
            )}
          </div>
        ) : (
          /* Waiting screen */
          <div className="flex flex-col justify-center items-center h-full text-center">
            <div className="mb-8">
              {localParticipant?.stream && (
                <div className="w-80 h-60 bg-gray-800 rounded-lg overflow-hidden mx-auto mb-6">
                  <VideoPlayer
                    stream={localParticipant.stream}
                    isLocal={true}
                    participantId={localParticipant.name || "You"}
                    muted={true}
                    isVideoEnabled={isVideoEnabled}
                  />
                </div>
              )}
            </div>
            <h3 className="text-2xl font-light mb-4">Ready to join?</h3>
            <p className="text-gray-400 mb-2">No one else is here</p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Share this meeting:</span>
              <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">{roomId}</code>
            </div>
          </div>
        )}

        {/* Participants sidebar (only show when there are participants) */}
        {participantsArray.length > 1 && (
          <div className="absolute top-4 right-4 w-64 bg-white rounded-lg shadow-lg overflow-hidden">
            <ParticipantsList participants={participantsArray} />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <ControlPanel
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={handleToggleVideo}
        onToggleAudio={handleToggleAudio}
        onLeaveRoom={handleLeaveRoom}
        participantCount={participantsArray.length}
      />
    </div>
  );
};

export default VideoCallRoom;