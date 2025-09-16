import React, { useState } from 'react';
import { Button } from './ui/button';

interface HomePageProps {
  onJoinRoom: (roomId: string, userName: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createRoom = async () => {
    if (!userName.trim()) {
      alert('Please enter your name before creating a room');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:8080/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        onJoinRoom(data.roomId, userName.trim());
      } else {
        console.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinExistingRoom = () => {
    if (!userName.trim()) {
      alert('Please enter your name before joining a room');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter a room code');
      return;
    }
    onJoinRoom(roomId.trim(), userName.trim());
  };


  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header like Google Meet */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-medium text-gray-900">Meet</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-normal text-gray-900">
              Premium video meetings.<br />Now free for everyone.
            </h1>
            <p className="text-gray-600">
              We re-engineered the service we built for secure business meetings, Google Meet, to make it free and available for all.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
              Your name
            </label>
            <input
              id="userName"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={createRoom}
              disabled={isCreating || !userName.trim()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting meeting...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  New meeting
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter a code or link"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && roomId.trim()) {
                    joinExistingRoom();
                  }
                }}
              />
              <Button
                onClick={joinExistingRoom}
                disabled={!roomId.trim() || !userName.trim()}
                variant="outline"
                className="px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="pt-8 space-y-4">
            <h3 className="text-lg font-medium text-center">Get a link you can share</h3>
            <p className="text-sm text-gray-600 text-center">
              Click <strong>New meeting</strong> to get a link you can send to people you want to meet with
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;