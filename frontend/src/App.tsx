import React, { useState } from 'react';
import HomePage from './components/HomePage';
import VideoCallRoom from './components/VideoCallRoom';

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  return (
    <div className="App">
      {currentRoom ? (
        <VideoCallRoom 
          roomId={currentRoom} 
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <HomePage onJoinRoom={handleJoinRoom} />
      )}
    </div>
  );
}

export default App;
