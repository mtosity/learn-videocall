import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream?: MediaStream;
  isLocal: boolean;
  participantId: string;
  muted?: boolean;
  isVideoEnabled?: boolean;
  connectionState?: RTCPeerConnectionState;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isLocal,
  participantId,
  muted = false,
  isVideoEnabled = true,
  connectionState
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getConnectionBorderClass = () => {
    if (isLocal) return 'border-blue-500';
    
    switch (connectionState) {
      case 'connected':
        return 'border-green-500';
      case 'connecting':
        return 'border-yellow-500';
      case 'disconnected':
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-gray-500';
    }
  };

  const getConnectionStatusClass = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500 text-white';
      case 'connecting':
        return 'bg-yellow-500 text-yellow-900';
      case 'disconnected':
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const showVideo = stream && isVideoEnabled;

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden bg-black border-2 ${getConnectionBorderClass()}`}>
      <div className="relative w-full h-full">
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted || isLocal}
            className="w-full h-full object-cover bg-black"
          />
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white bg-opacity-20 flex justify-center items-center text-2xl md:text-3xl font-bold text-white mb-4">
              {participantId.charAt(0).toUpperCase()}
            </div>
            {!isVideoEnabled && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 p-2 rounded">
                <span className="text-xl grayscale">📷</span>
              </div>
            )}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-white font-medium text-sm">{participantId}</span>
            {connectionState && !isLocal && (
              <span className={`text-xs px-2 py-1 rounded-full uppercase font-semibold ${getConnectionStatusClass()}`}>
                {connectionState}
              </span>
            )}
          </div>
          
          {!isLocal && (
            <div className="flex gap-2">
              {/* Add controls for remote videos if needed */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;