import { initPostComposer } from '../components/postComposer.js';
import { createPostList } from '../components/postList.js';
import { api } from '../lib/api.js';
import { userCard } from '../lib/templates.js';
import {
  clearFieldErrors,
  escapeHtml,
  formValues,
  readPageData,
  setBusy,
  showFieldErrors,
  toast,
} from '../lib/ui.js';
import { groupRules, validateFields } from '../lib/validation.js';

const groupId = readPageData('group-id');
const $header = $('#group-header');
const $admin = $('#group-admin');
const $editForm = $('#edit-group-form');
const $requests = $('#join-requests');
const $members = $('#group-members');
const $deleteGroup = $('#delete-group');

let state = { group: null, canViewContent: false };
const isAdminRole = (role) => role === 'owner' || role === 'admin';

const button = (className, label, extra = '') =>
  `<button type="button" class="btn ${className}" ${extra}>${escapeHtml(label)}</button>`;

function membershipButton(role, privacy) {
  if (role === 'none') {
    return button('btn--primary js-join', privacy === 'private' ? 'Request to join' : 'Join group');
  }
  if (role === 'pending') return button('btn--ghost js-leave', 'Cancel request');
  if (role === 'owner') return '';
  return button('btn--ghost btn--danger js-leave', 'Leave group');
}

function renderHeader({ group, owner }) {
  $header.html(`
    <div class="row row--between">
      <div>
        <h1>${escapeHtml(group.name)}</h1>
        <div class="row small">
          <span class="badge">${escapeHtml(group.category)}</span>
          <span class="badge ${group.privacy === 'private' ? 'badge--private' : ''}">${escapeHtml(group.privacy)}</span>
          <span class="muted">${group.memberCount} member${group.memberCount === 1 ? '' : 's'}</span>
          <span class="muted">Owner: <a href="/users/${escapeHtml(owner.id)}">${escapeHtml(owner.displayName)}</a></span>
        </div>
      </div>
      <div class="row">${membershipButton(group.role, group.privacy)}</div>
    </div>
    ${group.description ? `<p>${escapeHtml(group.description)}</p>` : ''}
  `);
}

function fillEditForm(group) {
  ['name', 'description', 'category', 'privacy'].forEach((field) =>
    $editForm.find(`[name=${field}]`).val(group[field]),
  );
}

function memberActions(member, viewerRole) {
  if (!isAdminRole(viewerRole) || member.role === 'owner') return '';
  const actions = [];
  if (member.role === 'member') actions.push(button('js-promote', 'Make admin'));
  if (member.role === 'admin' && viewerRole === 'owner') {
    actions.push(button('btn--ghost js-demote', 'Remove admin'));
  }
  if (member.role === 'member' || viewerRole === 'owner') {
    actions.push(button('btn--ghost btn--danger js-remove-member', 'Remove'));
  }
  return actions.join('');
}

async function loadMembers() {
  if (!state.canViewContent) {
    $members.html('<p class="muted">Members are visible to group members only.</p>');
    return;
  }
  const { items } = await api.get(`/api/groups/${groupId}/members`);
  $members.html(
    items
      .map((member) =>
        userCard(
          { ...member, bio: '' },
          `<span class="badge">${escapeHtml(member.role)}</span>${memberActions(member, state.group.role)}`,
        ),
      )
      .join(''),
  );
}

async function loadRequests() {
  const { items } = await api.get(`/api/groups/${groupId}/requests`);
  $requests.html(
    items.length
      ? items
          .map((user) =>
            userCard(
              user,
              button('btn--primary js-approve', 'Approve') +
                button('btn--ghost js-decline', 'Decline'),
            ),
          )
          .join('')
      : '<p class="muted small">No pending requests.</p>',
  );
}

async function loadGroup() {
  try {
    const data = await api.get(`/api/groups/${groupId}`);
    state = { group: data.group, canViewContent: data.canViewContent };
    document.title = `${data.group.name} · Circles`;
    renderHeader(data);

    const isAdmin = isAdminRole(data.group.role);
    $admin.toggleClass('hidden', !isAdmin);
    $deleteGroup.toggleClass('hidden', data.group.role !== 'owner');
    if (isAdmin) {
      fillEditForm(data.group);
      await loadRequests();
    }
    await loadMembers();
    return state;
  } catch (error) {
    $header.html(`<p class="error">${escapeHtml(error.message)}</p>`);
    return null;
  }
}

/** Runs an API action from a button, then reloads the page state. */
async function runAction($button, perform, successMessage) {
  $button.prop('disabled', true);
  try {
    await perform();
    toast(successMessage, 'success');
    await loadGroup();
  } catch (error) {
    toast(error.message, 'error');
    $button.prop('disabled', false);
  }
}

const userIdOf = (element) => $(element).closest('[data-user-id]').attr('data-user-id');

$header.on('click', '.js-join', function join() {
  runAction($(this), () => api.post(`/api/groups/${groupId}/join`), 'Done!');
});

$header.on('click', '.js-leave', function leave() {
  const isPending = state.group.role === 'pending';
  if (!window.confirm(isPending ? 'Cancel your join request?' : 'Leave this group?')) return;
  runAction($(this), () => api.delete(`/api/groups/${groupId}/membership`), 'Done');
});

$requests.on('click', '.js-approve', function approve() {
  const userId = userIdOf(this);
  runAction(
    $(this),
    () => api.post(`/api/groups/${groupId}/requests/${userId}/approve`),
    'Member approved',
  );
});

$requests.on('click', '.js-decline', function decline() {
  const userId = userIdOf(this);
  runAction(
    $(this),
    () => api.post(`/api/groups/${groupId}/requests/${userId}/decline`),
    'Request declined',
  );
});

$members.on('click', '.js-promote', function promote() {
  const userId = userIdOf(this);
  runAction(
    $(this),
    () => api.post(`/api/groups/${groupId}/admins/${userId}`),
    'Promoted to admin',
  );
});

$members.on('click', '.js-demote', function demote() {
  const userId = userIdOf(this);
  runAction(
    $(this),
    () => api.delete(`/api/groups/${groupId}/admins/${userId}`),
    'Admin rights removed',
  );
});

$members.on('click', '.js-remove-member', function remove() {
  if (!window.confirm('Remove this member from the group?')) return;
  const userId = userIdOf(this);
  runAction(
    $(this),
    () => api.delete(`/api/groups/${groupId}/members/${userId}`),
    'Member removed',
  );
});

$editForm.on('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors($editForm);
  const values = formValues($editForm);
  const errors = validateFields(values, groupRules());
  if (errors) return showFieldErrors($editForm, errors);

  const $submit = $editForm.find('[type=submit]');
  setBusy($submit, true);
  try {
    await api.patch(`/api/groups/${groupId}`, values);
    toast('Group updated', 'success');
    await loadGroup();
  } catch (error) {
    showFieldErrors($editForm, error.details);
    toast(error.message, 'error');
  } finally {
    setBusy($submit, false);
  }
});

$deleteGroup.on('click', async () => {
  if (!window.confirm('Delete this group and all of its posts? This cannot be undone.')) return;
  try {
    await api.delete(`/api/groups/${groupId}`);
    window.location.assign('/groups');
  } catch (error) {
    toast(error.message, 'error');
  }
});

export const groupReady = loadGroup();

const MEMBER_ROLES = ['owner', 'admin', 'member'];

groupReady.then((initial) => {
  if (!initial) return;
  if (!initial.canViewContent) {
    $('#group-posts').html(
      '<p class="card muted">This is a private group. Posts are visible to members only.</p>',
    );
    return;
  }
  const posts = createPostList($('#group-posts'), {
    fetchPage: (page) => api.get('/api/posts', { groupId, page, limit: 10 }),
    emptyText: 'No posts in this group yet.',
  });
  if (MEMBER_ROLES.includes(initial.group.role)) {
    $('#group-composer').removeClass('hidden');
    initPostComposer($('#group-composer .js-post-composer'), {
      groupId,
      onCreated: () => posts.reset(),
    });
  }
});
