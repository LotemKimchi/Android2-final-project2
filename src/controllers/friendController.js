import { User } from '../models/User.js';
import { toPublicUser } from '../presenters/userPresenter.js';
import * as friendService from '../services/friendService.js';

export async function listFriends(req, res) {
  const user = await User.findById(req.user.id).populate('friends').lean();
  res.json({ items: user.friends.map(toPublicUser) });
}

export async function listFriendRequests(req, res) {
  const [me, outgoing] = await Promise.all([
    User.findById(req.user.id).populate('friendRequests').lean(),
    User.find({ friendRequests: req.user.id }).lean(),
  ]);
  res.json({ incoming: me.friendRequests.map(toPublicUser), outgoing: outgoing.map(toPublicUser) });
}

export async function sendRequest(req, res) {
  const relationship = await friendService.sendFriendRequest(req.user.id, req.valid.params.id);
  res.json({ relationship });
}

export async function acceptRequest(req, res) {
  const relationship = await friendService.acceptFriendRequest(req.user.id, req.valid.params.id);
  res.json({ relationship });
}

export async function declineRequest(req, res) {
  const relationship = await friendService.declineFriendRequest(req.user.id, req.valid.params.id);
  res.json({ relationship });
}

export async function removeFriendship(req, res) {
  const relationship = await friendService.removeFriendship(req.user.id, req.valid.params.id);
  res.json({ relationship });
}
