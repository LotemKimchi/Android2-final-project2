import { api } from '../lib/api.js';
import { clearFieldErrors, formValues, setBusy, showFieldErrors, toast } from '../lib/ui.js';
import { rules, validateFields } from '../lib/validation.js';

const $form = $('#login-form');

/**
 * Only allow same-origin redirects (prevents open redirect via ?next=).
 * The value is parsed like a browser would (so `/\evil.com`, tabs, absolute URLs are caught)
 * and rebuilt from path + query + hash.
 */
function nextUrl() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return '/feed';
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return '/feed';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/feed';
  }
}

$form.on('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors($form);

  const values = formValues($form);
  values.password = $form.find('[name=password]').val(); // passwords are not trimmed
  const errors = validateFields(values, {
    username: [rules.required()],
    password: [rules.required()],
  });
  if (errors) return showFieldErrors($form, errors);

  const $submit = $form.find('[type=submit]');
  setBusy($submit, true);
  try {
    await api.post('/api/auth/login', { username: values.username, password: values.password });
    window.location.assign(nextUrl());
  } catch (error) {
    showFieldErrors($form, error.details);
    toast(error.message, 'error');
  } finally {
    setBusy($submit, false);
  }
});
