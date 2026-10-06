export function toMessage(message) {
  return {
    id: String(message._id),
    from: String(message.from),
    to: String(message.to),
    text: message.text,
    createdAt: message.createdAt,
    edited: Boolean(message.editedAt),
  };
}
