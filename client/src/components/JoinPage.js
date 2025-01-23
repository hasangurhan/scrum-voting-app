import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

function JoinPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(location.state?.username || '');
  const [copied, setCopied] = useState(false);
  const isModerator = location.state?.isModerator || false;

  const handleCopyLink = () => {
    const joinLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/room/${roomId}`, {
        state: {
          username,
          isModerator
        }
      });
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

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 mx-4">
        <h2 className="text-2xl font-bold mb-6 text-[#154460] text-center">Your room has been created</h2>
        <p className="text-center text-gray-600 mb-6">Click Join Room button to continue</p>
        
        <div className="mb-8">
          <div className="flex justify-center items-center gap-2">
            <h2 className="text-xl font-bold text-[#154460]">Room ID:</h2>
            <span className="text-xl font-bold text-[#154460]">{roomId}</span>
            <button
              onClick={handleCopyLink}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-300 relative"
              title="Copy join link"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#154460]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#154460] hover:bg-[#1c5a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#154460] transition-all duration-300"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinPage; 