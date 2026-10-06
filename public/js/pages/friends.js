import { api } from '../lib/api.js';
import { userCard } from '../lib/templates.js';
import { escapeHtml, toast } from '../lib/ui.js';

const $friends = $('#friends-list');
const $incoming = $('#incoming-requests');
const $outgoing = $('#outgoing-requests');

const button = (className, label) =>
  `<button type="button" class="btn ${className}">${escapeHtml(label)}</button>`;

function renderList($container, users, actionsHtml, emptyText) {
  $container.html(
    users.length
      ? users.map((user) => userCard(user, actionsHtml)).join('')
      : `<p class="muted">${escapeHtml(emptyText)}</p>`,
  );
}

async function load() {
  try {
    const [{ items: friends }, { incoming, outgoing }] = await Promise.all([
      api.get('/api/users/me/friends'),
      api.get('/api/users/me/friend-requests'),
    ]);
    renderList(
      $friends,
      friends,
      `<a class="btn js-chat" href="#">Message</a>${button('btn--ghost btn--danger js-unfriend', 'Unfriend')}`,
      'No friends yet — find people on the People page.',
    );
    renderList(
      $incoming,
      incoming,
      button('btn--primary js-accept', 'Accept') + button('btn--ghost js-decline', 'Decline'),
      'No pending requests.',
    );
    renderList($outgoing, outgoing, button('btn--ghost js-cancel', 'Cancel'), 'No sent requests.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

const userIdOf = (element) => $(element).closest('[data-user-id]').attr('data-user-id');

function onAction(selector, perform, successMessage, confirmMessage) {
  $(document).on('click', selector, async function handleAction(event) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const userId = userIdOf(this);
    $(this).prop('disabled', true);
    try {
      await perform(userId);
      toast(successMessage, 'success');
      await load();
    } catch (error) {
      toast(error.message, 'error');
      $(this).prop('disabled', false);
    }
  });
}

onAction('.js-accept', (id) => api.post(`/api/users/${id}/friend-request/accept`), 'Friend added');
onAction(
  '.js-decline',
  (id) => api.post(`/api/users/${id}/friend-request/decline`),
  'Request declined',
);
onAction('.js-cancel', (id) => api.delete(`/api/users/${id}/friendship`), 'Request cancelled');
onAction(
  '.js-unfriend',
  (id) => api.delete(`/api/users/${id}/friendship`),
  'Friend removed',
  'Remove this friend?',
);

$(document).on('click', '.js-chat', function openChat(event) {
  event.preventDefault();
  window.location.assign(`/chat?with=${encodeURIComponent(userIdOf(this))}`);
});

load();
