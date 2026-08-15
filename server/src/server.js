import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './sockets/socket.js';
import { env } from './config/env.js';

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Create HTTP Server
  const server = http.createServer(app);

  // 3. Initialize Socket.IO
  initSocket(server);

  // 4. Start Server Listening
  server.listen(env.port, () => {
    console.log(`Smart Police Station server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error(`Fatal Server Error: ${error.message}`);
  process.exit(1);
});
