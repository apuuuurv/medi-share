import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocketIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production frontend domain in deployment
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // 1. Join a specific task room to track live delivery/pickup
    socket.on('join_task_room', (taskId: string) => {
      socket.join(`task_${taskId}`);
      console.log(`Socket ${socket.id} joined room: task_${taskId}`);
    });

    // 2. Leave task room
    socket.on('leave_task_room', (taskId: string) => {
      socket.leave(`task_${taskId}`);
      console.log(`Socket ${socket.id} left room: task_${taskId}`);
    });

    // 3. Live Volunteer Location Broadcast
    socket.on('update_location', (data: { taskId: string; latitude: number; longitude: number }) => {
      const { taskId, latitude, longitude } = data;
      
      // Broadcast coordinates to everyone listening in the task room (e.g., donor/beneficiary/NGO dashboard)
      socket.to(`task_${taskId}`).emit('volunteer_location_updated', {
        taskId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Global helper to emit real-time status changes from any controller
export const emitStatusUpdate = (room: string, eventName: string, payload: any) => {
  if (io) {
    io.to(room).emit(eventName, payload);
  }
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};