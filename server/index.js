const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Room = require('./models/Room'); // Room modelini ekleyelim

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect('mongodb+srv://hasanngurhann01:TpTILZRNHPEH9UEd@scrum-poker.v2hcw.mongodb.net/?retryWrites=true&w=majority&appName=scrum-poker')
  .then(() => console.log('MongoDB connection successful'))
  .catch(err => console.error('MongoDB connection error:', err));

// Odalar ve kullanıcıları tutacak obje
const rooms = {};

// API endpoint'leri
app.get('/api/history', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Geçmiş verileri alınamadı' });
  }
});

// Socket.io olayları
io.on('connection', (socket) => {
  console.log('New user connected');

  // Creating a room or joining an existing room
  socket.on('createRoom', async ({ roomId, moderator }) => {
    try {
      console.log('createRoom');

      // First check if the room exists
      let room = await Room.findOne({ roomId });
      
      if (!room) {
        // If room doesn't exist, create a new one
        room = new Room({
          roomId,
          moderator,
          history: []
        });
        await room.save();
        
        // Create new room in memory
        rooms[roomId] = {
          moderator,
          users: [{ id: socket.id, name: moderator, isModerator: true }],
          votes: {},
          history: []
        };
      } else {
        // If room exists but not in memory, create it
        if (!rooms[roomId]) {
          rooms[roomId] = {
            moderator: room.moderator,
            users: [{ id: socket.id, name: moderator, isModerator: true }],
            votes: {},
            history: room.history
          };
        } else {
          // If room exists in memory, add the user
          rooms[roomId].users.push({ id: socket.id, name: moderator, isModerator: true });
        }
      }
      
      socket.join(roomId);
      io.to(roomId).emit('roomUpdate', rooms[roomId]);
      
      // Send room status
      socket.emit('roomStatus', { exists: !!room, isModerator: true });
    } catch (error) {
      console.error('Room operation error:', error);
      socket.emit('roomError', { message: 'An error occurred during room operation' });
    }
  });

  // Joining a room
  socket.on('joinRoom', async ({ roomId, username }) => {
    try {
      console.log('joinRoom');
      // Check if the room exists in database
      const room = await Room.findOne({ roomId });
      
      if (!room) {
        socket.emit('roomError', { message: 'Room not found' });
        return;
      }

      if (!rooms[roomId]) {
        // If room doesn't exist in memory, create it
        rooms[roomId] = {
          moderator: room.moderator,
          users: [],
          votes: {},
          history: room.history
        };
      }

      // Add user to the room
      socket.join(roomId);
      const newUser = {
        id: socket.id,
        name: username,
        isModerator: false
      };
      rooms[roomId].users.push(newUser);
      
      io.to(roomId).emit('roomUpdate', rooms[roomId]);
      socket.emit('roomStatus', { exists: true, isModerator: false });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('roomError', { message: 'Error joining the room' });
    }
  });

  // Voting
  socket.on('vote', ({ roomId, vote }) => {
    console.log('vote');
    if (rooms[roomId]) {
      rooms[roomId].votes[socket.id] = vote;
      io.to(roomId).emit('voteUpdate', rooms[roomId].votes);
    }
  });

  // Starting new voting session
  socket.on('startNewVoting', ({ roomId, taskId }) => {
    console.log('startNewVoting event received:', { roomId, taskId });
    
    if (rooms[roomId]) {
      // Reset room state
      rooms[roomId].votes = {};
      rooms[roomId].showResults = false;
      
      // Notify all users about new voting session
      io.to(roomId).emit('newVotingStarted', {
        taskId,
        message: 'new voting started',
        votes: {},
        showResults: false
      });
      
      // Send room update
      io.to(roomId).emit('roomUpdate', {
        ...rooms[roomId],
        votes: {},
        showResults: false,
        taskId
      });

      console.log('New voting session started for room:', roomId);
    } else {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
    }
  });

  // Show voting results
  socket.on('showResults', async ({ roomId, taskId }) => {
    console.log('showResults');
    if (rooms[roomId]) {
      const votes = rooms[roomId].votes;
      const voteValues = Object.values(votes);
      
      // Find the most frequent vote (final score)
      const finalScore = voteValues.sort((a, b) =>
        voteValues.filter(v => v === a).length - voteValues.filter(v => v === b).length
      ).pop();

      const result = {
        taskId,
        votes: rooms[roomId].users.map(user => ({
          user: user.name,
          vote: votes[user.id] || '?'
        })),
        finalScore,
        votedAt: new Date()
      };

      try {
        // Find and update the room in database
        await Room.findOneAndUpdate(
          { roomId },
          { $push: { history: result } },
          { new: true }
        );

        // Update history in memory
        rooms[roomId].history.push(result);
        io.to(roomId).emit('results', { votes, finalScore });
        rooms[roomId].votes = {}; // Reset votes
      } catch (error) {
        console.error('Error saving results:', error);
      }
    }
  });

  // On disconnect
  socket.on('disconnect', () => {
    console.log('disconnect');
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      const disconnectedUser = room.users.find(user => user.id === socket.id);
      
      // Remove user from the list
      room.users = room.users.filter(user => user.id !== socket.id);
      
      if (room.users.length === 0) {
        // If no users left, delete the room
        delete rooms[roomId];
      } else if (disconnectedUser?.isModerator) {
        // If the disconnected user was moderator, make the oldest user the new moderator
        const newModerator = room.users[0]; // First user is the oldest
        newModerator.isModerator = true;
        room.moderator = newModerator.name;
        
        // Notify everyone in the room about the new moderator
        io.to(roomId).emit('moderatorChanged', { newModerator: newModerator.name });
        io.to(roomId).emit('roomUpdate', room);
      } else {
        // If a regular user disconnected, just send room update
        io.to(roomId).emit('roomUpdate', room);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 