import { escapeHtml, formatDateTime, timeAgo } from './ui.js';

export const DEFAULT_AVATAR = '/images/default-avatar.svg';

export function avatarImg(user, size = 'md') {
  const src = escapeHtml(user.avatarUrl || DEFAULT_AVATAR);
  return `<img class="avatar avatar--${size}" src="${src}" alt="">`;
}

/** Card for a person. actionsHtml must already be safe HTML. */
export function userCard(user, actionsHtml = '') {
  const details = [user.age != null ? `${user.age}` : '', user.gender ?? '', user.city ?? '']
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');
  return `
    <article class="card card--hover entity-card" data-user-id="${escapeHtml(user.id)}">
      ${avatarImg(user)}
      <div class="entity-card__body">
        <a class="entity-card__title" href="/users/${escapeHtml(user.id)}">${escapeHtml(user.displayName)}</a>
        <div class="muted small">@${escapeHtml(user.username)}${details ? ` · ${details}` : ''}</div>
        ${user.bio ? `<p class="small">${escapeHtml(user.bio)}</p>` : ''}
        ${actionsHtml ? `<div class="row">${actionsHtml}</div>` : ''}
      </div>
    </article>`;
}

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  pending: 'Request pending',
};

export function groupCard(group) {
  const role = ROLE_LABELS[group.role];
  return `
    <article class="card card--hover" data-group-id="${escapeHtml(group.id)}">
      <a class="entity-card__title" href="/groups/${escapeHtml(group.id)}">${escapeHtml(group.name)}</a>
      <div class="row small">
        <span class="badge">${escapeHtml(group.category)}</span>
        <span class="badge ${group.privacy === 'private' ? 'badge--private' : ''}">${escapeHtml(group.privacy)}</span>
        <span class="muted">${group.memberCount} member${group.memberCount === 1 ? '' : 's'}</span>
        ${role ? `<span class="badge">${escapeHtml(role)}</span>` : ''}
      </div>
      ${group.description ? `<p class="small">${escapeHtml(group.description)}</p>` : ''}
    </article>`;
}

export function postCard(post) {
  const where = post.group
    ? ` <span class="muted">in</span> <a href="/groups/${escapeHtml(post.group.id)}">${escapeHtml(post.group.name)}</a>`
    : '';
  return `
    <article class="card post-card" data-post-id="${escapeHtml(post.id)}">
      <header class="post-card__header">
        ${avatarImg(post.author, 'sm')}
        <div>
          <a class="post-card__author" href="/users/${escapeHtml(post.author.id)}">${escapeHtml(post.author.displayName)}</a>${where}
          <div class="muted small" title="${escapeHtml(formatDateTime(post.createdAt))}">
            ${escapeHtml(timeAgo(post.createdAt))}${post.edited ? ' · edited' : ''}
          </div>
        </div>
      </header>
      <p class="post-card__content">${escapeHtml(post.content)}</p>
      ${post.imageUrl ? `<img class="post-card__image" src="${escapeHtml(post.imageUrl)}" alt="Image attached to the post" loading="lazy">` : ''}
      ${post.videoUrl ? `<div class="post-card__video" data-video-src="${escapeHtml(post.videoUrl)}"></div>` : ''}
      <footer class="post-card__actions">
        <button type="button" class="btn btn--ghost js-like${post.likedByMe ? ' is-active' : ''}" aria-pressed="${post.likedByMe}">
          ♥ <span class="js-like-count">${post.likeCount}</span>
        </button>
        ${post.canEdit ? '<button type="button" class="btn btn--ghost js-edit">Edit</button>' : ''}
        ${post.canDelete ? '<button type="button" class="btn btn--ghost btn--danger js-delete">Delete</button>' : ''}
      </footer>
    </article>`;
}
