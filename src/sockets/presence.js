/** userId → number of open sockets (a user may have several tabs). In-memory, single process. */
const connectionCounts = new Map();

/** Returns true when this is the user's first connection (they just came online). */
export function markOnline(userId) {
  const count = (connectionCounts.get(userId) ?? 0) + 1;
  connectionCounts.set(userId, count);
  return count === 1;
}

/** Returns true when the user's last connection closed (they just went offline). */
export function markOffline(userId) {
  const count = (connectionCounts.get(userId) ?? 1) - 1;
  if (count <= 0) {
    connectionCounts.delete(userId);
    return true;
  }
  connectionCounts.set(userId, count);
  return false;
}

export function onlineAmong(userIds) {
  return userIds.map(String).filter((id) => connectionCounts.has(id));
}
