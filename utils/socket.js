function setupSocket(io) {
  io.on('connection', (socket) => {
    // Join a room for a DM between two users
    socket.on('joinDM', ({ user1, user2 }) => {
      const room = [user1, user2].sort().join('-');
      socket.join(room);
    });

    // Relay a new message to the DM room
    socket.on('dmMessage', ({ from, to, message }) => {
      const room = [from, to].sort().join('-');
      io.to(room).emit('dmMessage', { from, to, message });
    });
  });
}

module.exports = setupSocket;