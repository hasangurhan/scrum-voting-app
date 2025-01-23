import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const CARD_VALUES = ['1', '2', '3', '5', '8', '13', '21', '34', '?'];

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { username, isModerator } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [votes, setVotes] = useState({});
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!username) {
      navigate(`/join/${roomId}`);
      return;
    }

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    if (isModerator) {
      newSocket.emit('createRoom', { roomId, moderator: username });
    } else {
      newSocket.emit('joinRoom', { roomId, username });
    }

    // Get room history
    fetch(`http://localhost:5000/api/history`)
      .then(response => response.json())
      .then(data => {
        const roomHistory = data.find(room => room.roomId === roomId)?.history || [];
        setHistory(roomHistory);
      })
      .catch(error => console.error('Error:', error));

    newSocket.on('roomUpdate', (roomData) => {
      console.log('Room update received:', roomData);
      setUsers(roomData.users);
      if (roomData.votes !== undefined) {
        setVotes(roomData.votes);
      }
      if (roomData.showResults !== undefined) {
        setShowResults(roomData.showResults);
      }
      if (roomData.history) {
        setHistory(roomData.history);
      }
      if (roomData.taskId !== undefined) {
        setTaskId(roomData.taskId);
      }
    });

    newSocket.on('taskIdUpdate', (data) => {
      setTaskId(data.taskId);
    });

    newSocket.on('newVotingStarted', (data) => {
      console.log('New voting started:', data);
      // Reset all states
      setShowResults(false);
      setSelectedCard(null);
      setVotes({});
      setFinalScore(null);
      if (data.taskId) {
        setTaskId(data.taskId);
      }
    });

    newSocket.on('voteUpdate', (voteData) => {
      console.log('Vote update received:', voteData);
      setVotes(voteData);
    });

    newSocket.on('results', (result) => {
      setVotes(result.votes);
      setFinalScore(result.finalScore);
      setShowResults(true);
      if (result.history) {
        setHistory(result.history);
      }
    });

    newSocket.on('roomError', (error) => {
      setError(error.message);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    });

    newSocket.on('roomStatus', (status) => {
      if (status.exists && !status.isModerator && isModerator) {
        setError('This room already exists and is managed by another moderator');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    });

    return () => newSocket.close();
  }, [roomId, username, isModerator, navigate]);

  const handleVote = (value) => {
    if (!showResults) {
      setSelectedCard(value);
      socket.emit('vote', { roomId, vote: value });
    }
  };

  const handleShowResults = () => {
    if (!taskId.trim()) {
      setError('Jira Task ID is required to show the results');
      return;
    }
    
    if (Object.keys(votes).length === 0) {
      setError('At least one vote is required to show results');
      return;
    }

    // Hesapla ve geçmişe ekle
    const validVotes = Object.values(votes).filter(vote => vote !== '?');
    const total = validVotes.reduce((sum, vote) => sum + Number(vote), 0);
    const average = validVotes.length > 0 ? (total / validVotes.length).toFixed(1) : '0';
    
    const newRecord = {
      taskId: taskId,
      finalScore: average,
      votedAt: new Date().toISOString()
    };
    
    setHistory(prevHistory => [...prevHistory, newRecord]);
    setError(null);
    socket.emit('showResults', { roomId, taskId });
  };

  const handleTaskIdChange = (e) => {
    const newTaskId = e.target.value;
    setTaskId(newTaskId);
    setError(null);
    socket.emit('updateTaskId', { roomId, taskId: newTaskId });
  };

  const startNewVoting = () => {
    if (!taskId.trim()) {
      setError('Please enter a Task ID');
      return;
    }
    setError(null);
    
    // Önce local state'i güncelle
    setShowResults(false);
    setSelectedCard(null);
    setVotes({});
    setFinalScore(null);
    
    // Sonra socket event'i gönder
    socket.emit('startNewVoting', { roomId, taskId });
  };

  if (error && (error.includes('moderatör') || error.includes('moderator'))) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center">
        <div className="max-w-md p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
          <p className="text-sm mt-2">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

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

      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-y-auto p-8 mx-4 max-h-[calc(100vh-180px)]">
        <div className="mb-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#154460] mb-2">Room: {roomId}</span>
            {isModerator && (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={taskId}
                    onChange={handleTaskIdChange}
                    onFocus={() => setError(null)}
                    placeholder="Jira Task ID"
                    className={`w-full px-3 py-2 border rounded transition-colors duration-300 ${
                      error 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-[#154460] focus:ring-[#154460] focus:border-[#154460]'
                    }`}
                  />
                  {error && (
                    <p className="text-red-500 text-sm absolute top-full mt-1">{error}</p>
                  )}
                </div>
                <button
                  onClick={startNewVoting}
                  className="bg-[#154460] text-white px-6 py-2 rounded hover:bg-[#1c5a7d] transition-colors duration-300 whitespace-nowrap"
                >
                  Start New Vote
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            {!showResults ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-[#154460]">Cards</h3>
                <div className="grid grid-cols-3 gap-3">
                  {CARD_VALUES.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleVote(value)}
                      className={`p-6 text-center text-lg border-2 border-[#154460] rounded transition-colors ${
                        selectedCard === value 
                          ? 'bg-[#154460] text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-[#154460] p-6">
                <h3 className="text-xl font-semibold mb-4 text-[#154460] text-center">Voting Result</h3>
                <p className="text-3xl font-bold text-[#154460] text-center mb-6">
                  {(() => {
                    const validVotes = Object.values(votes).filter(vote => vote !== '?');
                    if (validVotes.length === 0) return '0 Points';
                    const total = validVotes.reduce((sum, vote) => sum + Number(vote), 0);
                    const average = (total / validVotes.length).toFixed(1);
                    return `${average} Points`;
                  })()}
                </p>
                
                <div className="space-y-2">
                  {Object.entries(
                    Object.values(votes).reduce((acc, vote) => {
                      acc[vote] = (acc[vote] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([vote, count]) => (
                    <div key={vote} className="flex justify-between items-center text-[#154460]">
                      <span className="font-medium">{vote} points:</span>
                      <span>{count} people</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#154460]">Participants</h3>
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium flex items-center gap-2">
                    {user.name}
                    {user.isModerator && <span className="text-sm text-[#154460] font-semibold">(Owner)</span>}
                  </span>
                  {votes[user.id] && !showResults && (
                    <span className="text-green-500">✓</span>
                  )}
                  {showResults && (
                    <span className="font-bold text-[#154460]">{votes[user.id]}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {isModerator && Object.keys(votes).length > 0 && Object.keys(votes).length === users.length && !showResults && (
          <button
            onClick={handleShowResults}
            className="w-full mt-8 py-3 px-4 bg-[#154460] text-white rounded hover:bg-[#1c5a7d] transition-colors duration-300 text-lg font-medium"
          >
            Show Results
          </button>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-[#154460]">Voting History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#154460] uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#154460] uppercase tracking-wider">Final Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#154460] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#154460]">{record.taskId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.finalScore} Points</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.votedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room; 