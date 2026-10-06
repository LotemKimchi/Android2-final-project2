/** Lets HTTP controllers push socket events without importing the socket server. */
let io = null;

export function setIo(server) {
  io = server;
}

export const userRoom = (userId) => `user:${userId}`;

export function emitToUsers(userIds, event, payload) {
  if (!io) return;
  const rooms = [...new Set(userIds.map(String))].map(userRoom);
  if (rooms.length > 0) io.to(rooms).emit(event, payload);
}
