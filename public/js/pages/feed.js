import { initPostComposer } from '../components/postComposer.js';
import { createPostList } from '../components/postList.js';
import { api } from '../lib/api.js';
import { escapeHtml } from '../lib/ui.js';

const feed = createPostList($('#feed-posts'), {
  fetchPage: (page) => api.get('/api/posts/feed', { page, limit: 10 }),
  emptyText: 'Your feed is empty — add friends or join groups to see posts here.',
});

initPostComposer($('.js-post-composer'), { onCreated: () => feed.reset() });

async function loadMyGroups() {
  const $list = $('#my-groups');
  try {
    const { items } = await api.get('/api/groups', { mine: true, limit: 20 });
    $list.html(
      items.length
        ? items
          .map(
            (group) => `<a href="/groups/${escapeHtml(group.id)}">${escapeHtml(group.name)}</a>`,
          )
          .join('')
        : '<p class="muted small">You have not joined any groups yet.</p>',
    );
  } catch (error) {
    $list.html(`<p class="error">${escapeHtml(error.message)}</p>`);
  }
}

loadMyGroups();
