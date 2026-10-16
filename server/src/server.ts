import "dotenv/config";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";
import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/database.js";
import { getJwtSecret } from "./middleware/auth.js";
import { registerSocketHandlers } from "./socket/handlers.js";

// Fail fast instead of signing tokens with a guessable secret
getJwtSecret();

const PORT = Number(process.env.PORT) || 3333;

const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: { ...corsOptions, methods: ["GET", "POST"] },
});

registerSocketHandlers(io);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🏐 Racha Vôlei server running on port ${PORT}`);
  });
});
