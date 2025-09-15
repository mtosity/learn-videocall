import React from 'react';

interface Participant {
  id: string;
  stream?: MediaStream;
  isLocal?: boolean;
  connectionState?: RTCPeerConnectionState;
}

interface ParticipantsListProps {
  participants: Participant[];
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants }) => {

  const getDisplayName = (participant: Participant) => {
    if (participant.isLocal) return 'You';
    return participant.id.startsWith('client-') 
      ? `User ${participant.id.slice(-4)}` 
      : participant.id;
  };

  return (
    <div className="h-full flex flex-col bg-white text-gray-900 max-h-96">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">People ({participants.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {participants.map(participant => (
          <div key={participant.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex justify-center items-center flex-shrink-0">
              <span className="text-sm font-medium text-blue-700">
                {getDisplayName(participant).charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName(participant)}
              </div>
              {!participant.isLocal && participant.connectionState && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {participant.connectionState === 'connected' ? 'Connected' :
                   participant.connectionState === 'connecting' ? 'Connecting...' :
                   'Connection issues'}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Microphone status */}
              <div className="w-4 h-4 text-gray-400">
                {participant.isLocal ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {participants.length === 1 && (
          <div className="text-center p-6 text-gray-500">
            <p className="text-sm">No one else is here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;