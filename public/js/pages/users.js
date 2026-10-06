import { api } from '../lib/api.js';
import { userCard } from '../lib/templates.js';
import {
  clearFieldErrors,
  escapeHtml,
  formValues,
  renderPager,
  showFieldErrors,
  toast,
} from '../lib/ui.js';
import { LIMITS, rules, validateFields } from '../lib/validation.js';

const $form = $('#user-search-form');
const $results = $('#user-results');
const $summary = $('#user-results-summary');
const $pager = $('#user-pager');
let criteria = {};

function validate(values) {
  return validateFields(values, {
    q: [rules.maxLength(60)],
    city: [rules.maxLength(LIMITS.cityMax)],
    minAge: [
      rules.intRange(0, LIMITS.maxAge),
      (min) =>
        min !== '' && values.maxAge !== '' && Number(min) > Number(values.maxAge)
          ? 'Min age cannot be greater than max age'
          : null,
    ],
    maxAge: [rules.intRange(0, LIMITS.maxAge)],
  });
}

async function search(page = 1) {
  try {
    const data = await api.get('/api/users', { ...criteria, page, limit: 12 });
    $summary.text(`${data.total} ${data.total === 1 ? 'person' : 'people'} found`);
    $results.html(
      data.items.length
        ? data.items.map((user) => userCard(user)).join('')
        : `<p class="muted">${escapeHtml('Nobody matches these filters.')}</p>`,
    );
    renderPager($pager, data, search);
  } catch (error) {
    showFieldErrors($form, error.details);
    toast(error.message, 'error');
  }
}

$form.on('submit', (event) => {
  event.preventDefault();
  clearFieldErrors($form);
  const values = formValues($form);
  const errors = validate(values);
  if (errors) return showFieldErrors($form, errors);
  criteria = values;
  search(1);
});

$form.on('reset', () => {
  clearFieldErrors($form);
  criteria = {};
  setTimeout(() => search(1)); // after the browser clears the inputs
});

search(1);
