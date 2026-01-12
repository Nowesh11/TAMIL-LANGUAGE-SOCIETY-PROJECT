import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Map to store socketId -> userId mapping
const onlineUsers = new Map<string, string>();

export default async function ioHandler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const path = '/api/socket/io';
    const httpServer: NetServer = res.socket.server as any;
    
    // Check if io instance already exists on httpServer to prevent recreation
    if (!(httpServer as any).io) {
      const io = new ServerIO(httpServer, {
        path: path,
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });
      
      // Attach to server to prevent garbage collection
      (httpServer as any).io = io;
      res.socket.server.io = io;

      io.on('connection', (socket) => {
        console.log('Client connected', socket.id);

        socket.on('join-room', async (userId: string) => {
          socket.join(userId);
          console.log(`Socket ${socket.id} joined room ${userId}`);
          
          // Track user online status
          if (userId && userId !== 'admin') {
            onlineUsers.set(socket.id, userId);
            try {
              await dbConnect();
              await User.findByIdAndUpdate(userId, { isOnline: true });
            } catch (e) {
              console.error('Error updating online status:', e);
            }
          }
        });

        socket.on('send-message', (message: any) => {
          // Broadcast to recipient room
          // message should contain recipientId and content
          const { recipientId } = message;
          if (recipientId) {
            io.to(recipientId).emit('receive-message', message);
          }
        });

        socket.on('disconnect', async () => {
          console.log('Client disconnected', socket.id);
          const userId = onlineUsers.get(socket.id);
          if (userId) {
            onlineUsers.delete(socket.id);
            try {
              await dbConnect();
              await User.findByIdAndUpdate(userId, { 
                isOnline: false,
                lastSeen: new Date()
              });
            } catch (e) {
              console.error('Error updating offline status:', e);
            }
          }
        });
      });
    } else {
      // Use existing instance
      res.socket.server.io = (httpServer as any).io;
    }
  }
  res.end();
}