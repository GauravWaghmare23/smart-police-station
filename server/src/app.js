import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';

// Middlewares
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';

// Routes imports
import authRoutes from './routes/auth.routes.js';
import stationRoutes from './routes/station.routes.js';
import officerRoutes from './routes/officer.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import firRoutes from './routes/fir.routes.js';
import sosRoutes from './routes/sos.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import reportRoutes from './routes/report.routes.js';
import crimeRoutes from './routes/crime.routes.js';
import patrolRoutes from './routes/patrol.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Standard middlewares
app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Serve uploads static folder
app.use('/uploads', express.static('uploads'));

// Health Check API
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.status(200).json({
    success: true,
    message: 'Smart Police backend is healthy',
    data: {
      status: 'UP',
      database: dbStatus,
      timestamp: new Date(),
      uptime: process.uptime()
    }
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/firs', firRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/crime', crimeRoutes);
app.use('/api/patrols', patrolRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
