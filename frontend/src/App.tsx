import React, { useState } from 'react';
import HomePage from './components/HomePage';
import VideoCallRoom from './components/VideoCallRoom';

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const handleJoinRoom = (roomId: string, userName: string) => {
    setCurrentRoom(roomId);
    setUserName(userName);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setUserName('');
  };

  return (
    <div className="App">
      {currentRoom ? (
        <VideoCallRoom
          roomId={currentRoom}
          userName={userName}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <HomePage onJoinRoom={handleJoinRoom} />
      )}
    </div>
  );
}

export default App;
