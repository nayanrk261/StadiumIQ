import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB, Zone } from './models/db.js';
import { seedDatabase } from './models/seedHelper.js';
import { createRouter } from './routes.js';
import { startSimulator } from './services/simulator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Bind Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log(` [36m[Socket.io] Client connected: ${socket.id} [0m`);
  
  socket.on('disconnect', () => {
    console.log(` [33m[Socket.io] Client disconnected: ${socket.id} [0m`);
  });
});

// Root ping
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Initialize database, auto-seed, and start server
async function bootstrap() {
  // Connect to DB (real or mock fallback)
  await connectDB();

  // Auto-seed if zones collection is empty
  try {
    const zones = await Zone.find({});
    if (zones.length === 0) {
      console.log(' [33m[Database] No zones detected. Running auto-seeding... [0m');
      await seedDatabase();
    } else {
      console.log(' [32m[Database] Zones data already present. Skipping auto-seed. [0m');
    }
  } catch (err) {
    console.error('Error during auto-seed check:', err.message);
  }

  // Register routes
  const router = createRouter(io);
  app.use('/api', router);

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Error Handler] Uncaught error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  // Start Simulator
  startSimulator(io);

  // Start Server
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` StadiumIQ Backend Live: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

bootstrap().catch(err => {
  console.error(' [31m[Server] Bootstrapping failed: [0m', err);
});
