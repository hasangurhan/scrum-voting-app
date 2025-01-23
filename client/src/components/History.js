import React, { useState, useEffect } from 'react';

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Get history data from server
    fetch('http://localhost:5000/api/history')
      .then(response => response.json())
      .then(data => setHistory(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Voting History</h2>

        <div className="space-y-4">
          {history.map((record, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Task: {record.taskId}</h3>
                <span className="text-gray-500">
                  {new Date(record.votedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Votes:</h4>
                  <ul className="space-y-1">
                    {record.votes.map((vote, vIndex) => (
                      <li key={vIndex} className="flex justify-between">
                        <span>{vote.user}</span>
                        <span className="font-medium">{vote.vote}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Final Score:</h4>
                  <span className="text-xl font-bold">{record.finalScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History; 