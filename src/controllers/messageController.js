import { Message } from '../models/Message.js';
import { toMessage } from '../presenters/messagePresenter.js';
import { findOwnMessage } from '../services/messageService.js';
import { emitToUsers } from '../sockets/emitter.js';

export async function getConversation(req, res) {
  const me = req.user.id;
  const { userId } = req.valid.params;
  const { before, limit } = req.valid.query;

  const filter = {
    $or: [
      { from: me, to: userId },
      { from: userId, to: me },
    ],
  };
  if (before) filter.createdAt = { $lt: before };

  // Fetch one extra to know whether older messages exist.
  const newestFirst = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = newestFirst.length > limit;
  const items = newestFirst.slice(0, limit).reverse().map(toMessage);
  res.json({ items, hasMore });
}

export async function updateMessage(req, res) {
  const message = await findOwnMessage(req.valid.params.id, req.user.id);
  message.text = req.valid.body.text;
  message.editedAt = new Date();
  await message.save();

  const payload = toMessage(message);
  emitToUsers([message.from, message.to], 'message:updated', payload);
  res.json({ message: payload });
}

export async function deleteMessage(req, res) {
  const message = await findOwnMessage(req.valid.params.id, req.user.id);
  await message.deleteOne();
  emitToUsers([message.from, message.to], 'message:deleted', {
    id: String(message._id),
    from: String(message.from),
    to: String(message.to),
  });
  res.status(204).end();
}
