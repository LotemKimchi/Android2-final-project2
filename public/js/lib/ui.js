const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString();
}

const TIME_UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(iso) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of TIME_UNITS) {
    if (seconds >= size) return formatter.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
}

export function toast(message, type = 'info') {
  const $toast = $('<div role="status"></div>').addClass(`toast toast--${type}`).text(message);
  $('#toast-region').append($toast);
  requestAnimationFrame(() => $toast.addClass('is-visible'));
  setTimeout(() => {
    $toast.removeClass('is-visible');
    setTimeout(() => $toast.remove(), 400);
  }, 3500);
}

/** details: { fieldName: [message, ...] } — same shape the API returns. */
export function showFieldErrors($form, details) {
  Object.entries(details ?? {}).forEach(([field, messages]) => {
    $form.find(`[data-error-for="${field}"]`).text(messages[0]);
    $form.find(`[name="${field}"]`).addClass('is-invalid').attr('aria-invalid', 'true');
  });
}

export function clearFieldErrors($form) {
  $form.find('[data-error-for]').text('');
  $form.find('.is-invalid').removeClass('is-invalid').removeAttr('aria-invalid');
}

export function setBusy($button, busy) {
  $button.prop('disabled', busy).toggleClass('is-busy', busy);
}

export function renderPager($pager, { page, totalPages }, onPage) {
  $pager.empty();
  if (totalPages <= 1) return;
  const $prev = $('<button type="button" class="btn btn--ghost">← Previous</button>')
    .prop('disabled', page <= 1)
    .on('click', () => onPage(page - 1));
  const $next = $('<button type="button" class="btn btn--ghost">Next →</button>')
    .prop('disabled', page >= totalPages)
    .on('click', () => onPage(page + 1));
  $pager.append(
    $prev,
    $('<span class="muted"></span>').text(`Page ${page} of ${totalPages}`),
    $next,
  );
}

/** Reads a data-* attribute set on <main> by the page template. */
export function readPageData(name) {
  return $('main').attr(`data-${name}`);
}

/** Collects text fields of a form into a plain object with trimmed values. */
export function formValues($form) {
  const values = {};
  $form.serializeArray().forEach(({ name, value }) => {
    values[name] = value.trim();
  });
  return values;
}
