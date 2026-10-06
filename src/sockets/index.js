import { parseCookie } from 'cookie';
import { Server } from 'socket.io';
import { User } from '../models/User.js';
import { getFriendIds } from '../services/friendService.js';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt.js';
import { registerChatHandlers } from './chatHandlers.js';
import { emitToUsers, setIo, userRoom } from './emitter.js';
import { markOffline, markOnline } from './presence.js';

/** Authenticates the socket with the same JWT cookie the HTTP app uses. */
async function authenticateSocket(socket, next) {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
    const payload = verifyToken(cookies[AUTH_COOKIE]);
    if (!payload || !(await User.exists({ _id: payload.sub }))) {
      return next(new Error('Unauthorized'));
    }
    socket.data.userId = String(payload.sub);
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Unauthorized'));
  }
}

async function notifyFriendsOfPresence(userId, online) {
  try {
    const friendIds = await getFriendIds(userId);
    emitToUsers(friendIds, 'presence:update', { userId, online });
  } catch (error) {
    console.error('Presence broadcast failed:', error);
  }
}

export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, { maxHttpBufferSize: 16 * 1024 });
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    socket.join(userRoom(userId));
    registerChatHandlers(socket);

    if (markOnline(userId)) notifyFriendsOfPresence(userId, true);
    socket.on('disconnect', () => {
      if (markOffline(userId)) notifyFriendsOfPresence(userId, false);
    });
  });

  setIo(io);
  return io;
}
