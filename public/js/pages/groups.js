import { api } from '../lib/api.js';
import { groupCard } from '../lib/templates.js';
import {
  clearFieldErrors,
  escapeHtml,
  formValues,
  renderPager,
  setBusy,
  showFieldErrors,
  toast,
} from '../lib/ui.js';
import { groupRules, rules, validateFields } from '../lib/validation.js';

const $searchForm = $('#group-search-form');
const $createForm = $('#create-group-form');
const $results = $('#group-results');
const $summary = $('#group-results-summary');
const $pager = $('#group-pager');
let criteria = {};

async function search(page = 1) {
  try {
    const data = await api.get('/api/groups', { ...criteria, page, limit: 12 });
    $summary.text(`${data.total} group${data.total === 1 ? '' : 's'} found`);
    $results.html(
      data.items.length
        ? data.items.map(groupCard).join('')
        : `<p class="muted">${escapeHtml('No groups match these filters.')}</p>`,
    );
    renderPager($pager, data, search);
  } catch (error) {
    showFieldErrors($searchForm, error.details);
    toast(error.message, 'error');
  }
}

$searchForm.on('submit', (event) => {
  event.preventDefault();
  clearFieldErrors($searchForm);
  const values = formValues($searchForm);
  const errors = validateFields(values, {
    name: [rules.maxLength(60)],
    minMembers: [rules.intRange(0, 1_000_000)],
  });
  if (errors) return showFieldErrors($searchForm, errors);
  criteria = values;
  search(1);
});

$searchForm.on('reset', () => {
  clearFieldErrors($searchForm);
  criteria = {};
  setTimeout(() => search(1));
});

$createForm.on('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors($createForm);
  const values = formValues($createForm);
  const errors = validateFields(values, groupRules());
  if (errors) return showFieldErrors($createForm, errors);

  const $submit = $createForm.find('[type=submit]');
  setBusy($submit, true);
  try {
    const { group } = await api.post('/api/groups', values);
    window.location.assign(`/groups/${group.id}`);
  } catch (error) {
    showFieldErrors($createForm, error.details);
    toast(error.message, 'error');
    setBusy($submit, false);
  }
});

search(1);
