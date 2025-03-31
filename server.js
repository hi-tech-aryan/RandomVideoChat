const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app); // Create HTTP server first
// const io = new Server(server); // Attach Socket.io to the server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (replace with your domain later)
    methods: ["GET", "POST"]
  }
});

let waitingUsers = [];

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io logic
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('find-partner', () => {
    waitingUsers.push(socket.id);
    console.log('🔍 Users in queue:', waitingUsers);

    if (waitingUsers.length >= 2) {
      const [user1, user2] = waitingUsers.splice(0, 2);
      io.to(user1).emit('partner-found', { partnerId: user2 });
      io.to(user2).emit('partner-found', { partnerId: user1 });
      console.log('🤝 Paired:', user1, 'with', user2);
    }
  });
  socket.on('signal', (data) => {
    // Forward signals to the partner
    io.to(data.partnerId).emit('signal', { 
      signal: data.signal, 
      senderId: socket.id 
    });
  });
  socket.on('chat-message', (data) => {
    displayMessage(data.message, false);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});