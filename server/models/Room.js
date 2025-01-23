const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  moderator: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  history: [{
    taskId: String,
    votes: [{
      user: String,
      vote: String
    }],
    finalScore: String,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Room', roomSchema); 