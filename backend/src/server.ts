import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import { initSocketIO } from './services/socketService.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocketIO(server);

const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

export const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected]: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected]: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⚡ Socket.IO initialized on http://localhost:${PORT}`);
  });
});

console.log('📖 Swagger Docs available at http://localhost:5000/api-docs');
