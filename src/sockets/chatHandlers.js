import { ZodError } from 'zod';
import { getFriendIds } from '../services/friendService.js';
import { sendMessage } from '../services/messageService.js';
import { HttpError } from '../utils/HttpError.js';
import { sendMessageSchema } from '../validators/messageSchemas.js';
import { emitToUsers } from './emitter.js';
import { onlineAmong } from './presence.js';

function toClientError(error) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Invalid data';
  if (error instanceof HttpError) return error.message;
  console.error('Socket handler error:', error);
  return 'Something went wrong';
}

/** Wraps a handler so it always answers the ack (if any) and never throws into socket.io. */
function withAck(handler) {
  return async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try {
      reply({ ok: true, ...(await handler(payload)) });
    } catch (error) {
      reply({ ok: false, error: toClientError(error) });
    }
  };
}

export function registerChatHandlers(socket) {
  const { userId } = socket.data;

  socket.on(
    'message:send',
    withAck(async (payload) => {
      const { to, text } = sendMessageSchema.parse(payload ?? {});
      const message = await sendMessage(userId, to, text);
      emitToUsers([userId, to], 'message:new', message);
      return { message };
    }),
  );

  socket.on(
    'presence:list',
    withAck(async () => ({ online: onlineAmong(await getFriendIds(userId)) })),
  );
}
