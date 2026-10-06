import { createPostList } from '../components/postList.js';
import { api } from '../lib/api.js';

createPostList($('#my-posts'), {
  fetchPage: (page) => api.get('/api/posts/mine', { page, limit: 10 }),
  emptyText: 'You have not posted anything yet.',
});
