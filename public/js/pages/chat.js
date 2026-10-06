import { api } from '../lib/api.js';
import { avatarImg } from '../lib/templates.js';
import {
  clearFieldErrors,
  escapeHtml,
  formatDateTime,
  readPageData,
  setBusy,
  showFieldErrors,
  toast,
} from '../lib/ui.js';
import { LIMITS, rules, validateFields } from '../lib/validation.js';

const SEND_TIMEOUT_MS = 5000;
const PAGE_SIZE = 30;

const myId = readPageData('user-id');
const socket = io();

const $friends = $('#chat-friends');
const $header = $('#chat-header');
const $messages = $('#chat-messages');
const $loadOlder = $('#chat-load-older');
const $form = $('#chat-form');
const $input = $form.find('[name=text]');

const state = { friends: new Map(), online: new Set(), activeId: null, oldest: null };

const messageSelector = (id) => `[data-message-id="${CSS.escape(id)}"]`;
const textRules = [rules.required('Type a message'), rules.maxLength(LIMITS.messageMax)];

function messageItem(message) {
  const isMine = message.from === myId;
  const actions = isMine
    ? '<button type="button" class="link-button js-edit-message">Edit</button><button type="button" class="link-button js-delete-message">Delete</button>'
    : '';
  return `
    <li class="chat__message${isMine ? ' chat__message--mine' : ''}" data-message-id="${escapeHtml(message.id)}">
      <p class="chat__bubble">${escapeHtml(message.text)}</p>
      <div class="small muted">${escapeHtml(formatDateTime(message.createdAt))}${message.edited ? ' · edited' : ''} ${actions}</div>
    </li>`;
}

function renderFriends() {
  if (state.friends.size === 0) {
    $friends.html('<li class="muted">Add friends to start chatting.</li>');
    return;
  }
  $friends.html(
    [...state.friends.values()]
      .map((friend) => {
        const isOnline = state.online.has(friend.id);
        return `
          <li>
            <button type="button" class="chat__friend${friend.id === state.activeId ? ' is-active' : ''}" data-user-id="${escapeHtml(friend.id)}">
              <span class="presence-dot${isOnline ? ' is-online' : ''}" title="${isOnline ? 'Online' : 'Offline'}"></span>
              ${avatarImg(friend, 'sm')}
              <span>${escapeHtml(friend.displayName)}</span>
              ${friend.unread ? `<span class="badge">${friend.unread}</span>` : ''}
            </button>
          </li>`;
      })
      .join(''),
  );
}

const scrollToBottom = () => $messages.scrollTop($messages[0].scrollHeight);
const belongsToActiveConversation = (message) =>
  state.activeId !== null && (message.from === state.activeId || message.to === state.activeId);

async function loadMessages() {
  const conversationId = state.activeId;
  try {
    const { items, hasMore } = await api.get(`/api/messages/with/${conversationId}`, {
      before: state.oldest ?? undefined,
      limit: PAGE_SIZE,
    });
    if (conversationId !== state.activeId) return; // switched friends mid-fetch
    $messages.prepend(items.map(messageItem).join(''));
    if (items.length > 0) state.oldest = items[0].createdAt;
    $loadOlder.toggleClass('hidden', !hasMore);
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function openConversation(friendId) {
  const friend = state.friends.get(friendId);
  if (!friend) {
    toast('You can only chat with friends', 'error');
    return;
  }
  state.activeId = friendId;
  state.oldest = null;
  friend.unread = 0;
  renderFriends();

  $header
    .removeClass('muted')
    .html(
      `${avatarImg(friend, 'sm')} <a href="/users/${escapeHtml(friend.id)}">${escapeHtml(friend.displayName)}</a>`,
    );
  $messages.empty();
  $form.removeClass('hidden');
  window.history.replaceState(null, '', `/chat?with=${encodeURIComponent(friendId)}`);

  await loadMessages();
  scrollToBottom();
  $input.trigger('focus');
}

async function loadFriends() {
  try {
    const { items } = await api.get('/api/users/me/friends');
    state.friends = new Map(items.map((friend) => [friend.id, { ...friend, unread: 0 }]));
    renderFriends();
    const requested = new URLSearchParams(window.location.search).get('with');
    if (requested) await openConversation(requested);
  } catch (error) {
    toast(error.message, 'error');
  }
}

// --- UI events ---

$friends.on('click', '.chat__friend', function selectFriend() {
  openConversation($(this).attr('data-user-id'));
});

$loadOlder.on('click', loadMessages);

$form.on('submit', (event) => {
  event.preventDefault();
  clearFieldErrors($form);
  const text = $input.val().trim();
  const errors = validateFields({ text }, { text: textRules });
  if (errors) return showFieldErrors($form, errors);

  const $submit = $form.find('[type=submit]');
  setBusy($submit, true);
  socket
    .timeout(SEND_TIMEOUT_MS)
    .emit('message:send', { to: state.activeId, text }, (timeoutError, response) => {
      setBusy($submit, false);
      if (timeoutError) return toast('Message not sent — connection problem', 'error');
      if (!response.ok) return toast(response.error, 'error');
      $input.val('').trigger('focus'); // the message itself arrives via "message:new"
    });
});

$messages.on('click', '.js-edit-message', async function editMessage() {
  const $item = $(this).closest('[data-message-id]');
  const current = $item.find('.chat__bubble').text();
  const text = window.prompt('Edit message', current)?.trim();
  if (text === undefined || text === current) return;
  const errors = validateFields({ text }, { text: textRules });
  if (errors) return toast(errors.text[0], 'error');
  try {
    await api.patch(`/api/messages/${$item.attr('data-message-id')}`, { text });
  } catch (error) {
    toast(error.message, 'error');
  }
});

$messages.on('click', '.js-delete-message', async function deleteMessage() {
  if (!window.confirm('Delete this message?')) return;
  try {
    await api.delete(
      `/api/messages/${$(this).closest('[data-message-id]').attr('data-message-id')}`,
    );
  } catch (error) {
    toast(error.message, 'error');
  }
});

// --- Socket events ---

socket.on('connect', () => {
  socket.emit('presence:list', {}, (response) => {
    if (!response?.ok) return;
    state.online = new Set(response.online);
    renderFriends();
  });
});

socket.on('connect_error', () => toast('Chat connection problem — retrying…', 'error'));

socket.on('presence:update', ({ userId, online }) => {
  if (online) state.online.add(userId);
  else state.online.delete(userId);
  renderFriends();
});

socket.on('message:new', (message) => {
  if (belongsToActiveConversation(message)) {
    $messages.append(messageItem(message));
    scrollToBottom();
    return;
  }
  const friend = state.friends.get(message.from);
  if (friend) {
    friend.unread += 1;
    renderFriends();
  }
});

socket.on('message:updated', (message) => {
  $messages.find(messageSelector(message.id)).replaceWith(messageItem(message));
});

socket.on('message:deleted', ({ id }) => {
  $messages.find(messageSelector(id)).remove();
});

loadFriends();
