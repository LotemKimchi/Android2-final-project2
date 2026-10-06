import { createPostList } from '../components/postList.js';
import { api } from '../lib/api.js';
import { clearFieldErrors, formValues, showFieldErrors, toast } from '../lib/ui.js';
import { LIMITS, rules, validateFields } from '../lib/validation.js';

const $form = $('#post-search-form');
let criteria = {};

const results = createPostList($('#post-results'), {
  fetchPage: (page) => api.get('/api/posts', { ...criteria, page, limit: 10 }),
  emptyText: 'No posts match your search.',
});

async function loadGroupOptions() {
  try {
    const { items } = await api.get('/api/groups', { mine: true, limit: 50 });
    const $select = $form.find('[name=groupId]');
    items.forEach((group) => $select.append($('<option></option>').val(group.id).text(group.name)));
  } catch (error) {
    toast(error.message, 'error');
  }
}

$form.on('submit', (event) => {
  event.preventDefault();
  clearFieldErrors($form);
  const values = formValues($form);
  const errors = validateFields(values, {
    q: [rules.maxLength(LIMITS.searchMax)],
    authorName: [rules.maxLength(60)],
    to: [rules.dateOrder(values.from)],
  });
  if (errors) return showFieldErrors($form, errors);
  criteria = values;
  results.reset();
});

$form.on('reset', () => {
  clearFieldErrors($form);
  criteria = {};
  setTimeout(() => results.reset());
});

loadGroupOptions();
