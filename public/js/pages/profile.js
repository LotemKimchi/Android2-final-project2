import { initPostComposer } from '../components/postComposer.js';
import { createPostList } from '../components/postList.js';
import { api } from '../lib/api.js';
import { avatarImg } from '../lib/templates.js';
import { escapeHtml, formatDate, readPageData, toast } from '../lib/ui.js';

const profileId = readPageData('profile-id');
const $header = $('#profile-header');

const RELATIONSHIP_ACTIONS = {
  self: '<a class="btn" href="/settings">Edit profile</a>',
  none: '<button type="button" class="btn btn--primary js-friend-action" data-action="request">Add friend</button>',
  outgoing:
    '<span class="muted">Request sent</span><button type="button" class="btn btn--ghost js-friend-action" data-action="remove">Cancel request</button>',
  incoming:
    '<button type="button" class="btn btn--primary js-friend-action" data-action="accept">Accept request</button><button type="button" class="btn btn--ghost js-friend-action" data-action="decline">Decline</button>',
  friends:
    '<a class="btn js-message">Message</a><button type="button" class="btn btn--ghost btn--danger js-friend-action" data-action="remove">Unfriend</button>',
};

const FRIEND_ENDPOINTS = {
  request: (id) => api.post(`/api/users/${id}/friend-request`),
  accept: (id) => api.post(`/api/users/${id}/friend-request/accept`),
  decline: (id) => api.post(`/api/users/${id}/friend-request/decline`),
  remove: (id) => api.delete(`/api/users/${id}/friendship`),
};

function detail(label, value) {
  return value ? `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>` : '';
}

function renderHeader(user, relationship) {
  const isSelf = relationship === 'self';
  $header.html(`
    ${avatarImg(user, 'lg')}
    <div class="profile-header__info">
      <h1>${escapeHtml(user.displayName)}</h1>
      <p class="muted">@${escapeHtml(user.username)}</p>
      ${user.bio ? `<p>${escapeHtml(user.bio)}</p>` : ''}
      <ul class="columns-text small">
        ${detail('Age', String(user.age))}
        ${detail('Gender', user.gender)}
        ${detail('City', user.city)}
        ${detail('Friends', String(user.friendCount))}
        ${detail('Joined', formatDate(user.createdAt))}
        ${isSelf ? detail('Email (private)', user.email) : ''}
        ${isSelf ? detail('Birth date (private)', user.birthDate) : ''}
      </ul>
    </div>
    <div class="row">${RELATIONSHIP_ACTIONS[relationship] ?? ''}</div>
  `);
  $header.find('.js-message').attr('href', `/chat?with=${encodeURIComponent(user.id)}`);
}

async function loadProfile() {
  try {
    const { user, relationship } = await api.get(`/api/users/${profileId}`);
    document.title = `${user.displayName} · Circles`;
    renderHeader(user, relationship);
    return { user, relationship };
  } catch (error) {
    $header.html(`<p class="error">${escapeHtml(error.message)}</p>`);
    return null;
  }
}

$header.on('click', '.js-friend-action', async function handleFriendAction() {
  const action = $(this).attr('data-action');
  if (action === 'remove' && !window.confirm('Are you sure?')) return;
  $(this).prop('disabled', true);
  try {
    await FRIEND_ENDPOINTS[action](profileId);
    await loadProfile();
  } catch (error) {
    toast(error.message, 'error');
    $(this).prop('disabled', false);
  }
});

export const profileReady = loadProfile();

profileReady.then((profile) => {
  if (!profile) return;
  const posts = createPostList($('#profile-posts'), {
    fetchPage: (page) => api.get('/api/posts', { authorId: profileId, page, limit: 10 }),
    emptyText:
      profile.relationship === 'friends' || profile.relationship === 'self'
        ? 'No posts yet.'
        : 'No posts you can see. Profile posts are visible to friends only.',
  });
  if (profile.relationship === 'self') {
    $('#profile-composer').removeClass('hidden');
    initPostComposer($('#profile-composer .js-post-composer'), { onCreated: () => posts.reset() });
  }
});
