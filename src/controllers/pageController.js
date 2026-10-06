/** Returns a handler that renders a page shell. `extra(req)` adds view locals. */
export function renderPage(view, title, extra = () => ({})) {
  return (req, res) => res.render(`pages/${view}`, { title, ...extra(req) });
}
