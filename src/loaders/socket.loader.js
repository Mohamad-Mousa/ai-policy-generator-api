const socketIO = require('socket.io');
const config = require('../config');

class SocketLoader {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      }
    });

    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('New client connected');

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = SocketLoader;