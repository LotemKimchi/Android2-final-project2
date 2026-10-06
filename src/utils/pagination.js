export function skipFor({ page, limit }) {
  return (page - 1) * limit;
}

export function toPage({ items, total, page, limit }) {
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
