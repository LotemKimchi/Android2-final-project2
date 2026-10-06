import { Message } from '../models/Message.js';
import { toMessage } from '../presenters/messagePresenter.js';
import { HttpError } from '../utils/HttpError.js';
import { sameId } from '../utils/ids.js';
import { areFriends } from './friendService.js';

export async function sendMessage(fromId, toId, text) {
  if (sameId(fromId, toId)) throw HttpError.badRequest("You can't message yourself");
  if (!(await areFriends(fromId, toId))) throw HttpError.forbidden('You can only message friends');
  const message = await Message.create({ from: fromId, to: toId, text });
  return toMessage(message);
}

/** Loads a message the user sent; others' messages cannot be edited or deleted. */
export async function findOwnMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  if (!message) throw HttpError.notFound('Message not found');
  if (!sameId(message.from, userId)) {
    throw HttpError.forbidden('You can only change messages you sent');
  }
  return message;
}
