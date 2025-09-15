import React from 'react';
import { Button } from './ui/button';

interface ControlPanelProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onLeaveRoom: () => void;
  participantCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onLeaveRoom,
  participantCount
}) => {
  return (
    <div className="flex justify-center items-center p-6 bg-gray-900">
      <div className="flex items-center space-x-4">
        {/* Microphone */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-12 h-12 rounded-full ${
            isAudioEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          onClick={onToggleAudio}
          title={isAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.22 2.22a.75.75 0 011.06 0L6.5 5.44V4a3 3 0 116 0v4c0 .432-.09.845-.254 1.22l1.44 1.44A5.004 5.004 0 0015 8a1 1 0 112 0 7.001 7.001 0 01-6.326 6.964L17.78 21.78a.75.75 0 11-1.06 1.06L2.22 3.28a.75.75 0 010-1.06zM9.254 12.254A3.002 3.002 0 016.5 8v1.44l2.754 2.814z" clipRule="evenodd" />
              <path d="M6.5 17H5a1 1 0 000 2h8a1 1 0 000-2h-1.5v-2.07a7.001 7.001 0 002.826-1.464L12.5 12.5V8a5 5 0 00-5-5c-.536 0-1.055.084-1.544.24L4.22 1.22a.75.75 0 00-1.06 1.06L6.5 5.62V17z" />
            </svg>
          )}
        </Button>

        {/* Camera */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-12 h-12 rounded-full ${
            isVideoEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          onClick={onToggleVideo}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM6.5 5.44L4.22 3.22H4a2 2 0 00-2 2v6a2 2 0 002 2h6c.075 0 .15-.004.223-.012L6.5 9.44V5.44zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clipRule="evenodd" />
            </svg>
          )}
        </Button>

        {/* Hangup */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white"
          onClick={onLeaveRoom}
          title="Leave call"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </Button>

        {/* More options */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
          title="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;