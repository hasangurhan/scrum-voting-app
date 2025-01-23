import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';
import History from './components/History';
import JoinPage from './components/JoinPage';

function App() {
  return (
    <Router>
      <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'linear-gradient(180deg, #002642, #154460)' }}>
        <div className="container mx-auto px-4 py-8 flex-grow pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
        <footer className="py-3 text-center text-white/80 text-sm fixed bottom-4 w-full">
          © 2025 OpenPayd Holdings Limited. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App; 