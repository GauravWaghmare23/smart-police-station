import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import PoliceOfficer from '../models/PoliceOfficer.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [env.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(); // Allow anonymous/unauthenticated socket links
      }

      const decoded = jwt.verify(token, env.jwtAccessSecret);
      const user = await User.findById(decoded.userId);
      if (user && user.status === 'ACTIVE') {
        socket.user = user;
      }
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(); // Connect as guest
    }
  });

  io.on('connection', (socket) => {
    console.log(`New Socket Connection: ${socket.id}`);

    // Join room based on user role and ID
    if (socket.user) {
      const userId = socket.user._id.toString();
      const role = socket.user.role;

      if (role === 'CONTROL_ROOM_ADMIN') {
        socket.join('control-room');
        console.log(`Socket ${socket.id} joined room: control-room`);
      } else if (role === 'CITIZEN') {
        socket.join(`citizen:${userId}`);
        console.log(`Socket ${socket.id} joined room: citizen:${userId}`);
      } else {
        // Police Roles (STATION_HEAD, INVESTIGATING_OFFICER, FIELD_OFFICER)
        socket.join(`officer:${userId}`);
        console.log(`Socket ${socket.id} joined room: officer:${userId}`);
        
        // Find station and join station room
        PoliceOfficer.findOne({ userId }).then((officer) => {
          if (officer && officer.stationId) {
            socket.join(`station:${officer.stationId}`);
            console.log(`Socket ${socket.id} joined room: station:${officer.stationId}`);
          }
        });
      }
    }

    // Handle real-time officer location updates
    socket.on('officer:location:update', async (data) => {
      if (socket.user && ['STATION_HEAD', 'INVESTIGATING_OFFICER', 'FIELD_OFFICER'].includes(socket.user.role)) {
        const { latitude, longitude } = data;
        try {
          const officer = await PoliceOfficer.findOneAndUpdate(
            { userId: socket.user._id },
            {
              currentLocation: { latitude, longitude },
              lastLocationUpdate: new Date()
            },
            { new: true }
          );
          
          if (officer) {
            // Broadcast location update to control room and station room
            const payload = {
              officerId: officer._id,
              userId: socket.user._id,
              name: socket.user.name,
              currentLocation: officer.currentLocation,
              lastLocationUpdate: officer.lastLocationUpdate
            };
            io.to('control-room').emit('officer:location', payload);
            if (officer.stationId) {
              io.to(`station:${officer.stationId}`).emit('officer:location', payload);
            }
          }
        } catch (err) {
          console.error('Error saving socket location update:', err.message);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

export const sendRealtimeEvent = (room, event, payload) => {
  if (io) {
    io.to(room).emit(event, payload);
    console.log(`Emitted event ${event} to room ${room}`);
  } else {
    console.warn(`Socket.IO not initialized. Event ${event} skipped.`);
  }
};
