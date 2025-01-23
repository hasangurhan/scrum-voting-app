import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const navigate = useNavigate();

  // Component mount olduğunda ve isCreating değiştiğinde random ID oluştur
  useEffect(() => {
    if (isCreating) {
      const randomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(randomId);
    } else {
      setRoomId('');
    }
  }, [isCreating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId && username) {
      if (isCreating) {
        navigate(`/join/${roomId}`, {
          state: {
            username,
            isModerator: true
          }
        });
      } else {
        navigate(`/room/${roomId}`, { 
          state: { 
            username,
            isModerator: false
          } 
        });
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center">
      <div className="w-full pt-12 pb-6">
        <img 
          src="https://cdn.openpayd.com/images/branding/logos/openpayd_logo_2021_white.svg" 
          alt="OpenPayd Logo"
          className="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        />
      </div>

      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden p-8 mx-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#154460]">Scrum Poker</h1>
        
        <div className="relative mb-8">
          {/* Toggle Container */}
          <div className="w-full h-12 bg-gray-100 rounded-lg p-1">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 transition-all duration-300 ease-in-out h-10 w-1/2 bg-[#154460] rounded-md ${
                isCreating ? 'left-1' : 'left-[calc(50%-2px)]'
              }`}
            />
            
            {/* Button Container */}
            <div className="relative flex h-full">
              <button
                className={`flex-1 transition-colors duration-300 rounded-md font-medium ${
                  isCreating ? 'text-white' : 'text-gray-600'
                }`}
                onClick={() => setIsCreating(true)}
              >
                Create Room
              </button>
              <button
                className={`flex-1 transition-colors duration-300 rounded-md font-medium ${
                  !isCreating ? 'text-white' : 'text-gray-600'
                }`}
                onClick={() => setIsCreating(false)}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCreating ? (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Room ID:
              </label>
              <div className="text-[#154460] font-bold text-xl mt-1">
                {roomId}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-[#154460] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#154460] focus:border-[#154460] transition-all duration-300"
                placeholder="Enter existing room ID"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-[#154460] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#154460] focus:border-[#154460] transition-all duration-300"
              placeholder="Enter your username"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#154460] hover:bg-[#1c5a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#154460] transition-all duration-300 mt-6"
          >
            {isCreating ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home; 