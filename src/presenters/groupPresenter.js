import { roleOf } from '../services/groupAccess.js';

export function toGroup(group, viewerId) {
  return {
    id: String(group._id),
    name: group.name,
    description: group.description,
    category: group.category,
    privacy: group.privacy,
    memberCount: group.members.length,
    role: roleOf(group, viewerId),
    createdAt: group.createdAt,
  };
}
