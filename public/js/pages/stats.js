import { renderHorizontalBarChart } from '../charts/barChart.js';
import { renderLineChart } from '../charts/lineChart.js';
import { renderPieChart } from '../charts/pieChart.js';
import { api } from '../lib/api.js';
import { escapeHtml } from '../lib/ui.js';

const lineContainer = document.getElementById('posts-per-month-chart');
const pieContainer = document.getElementById('posts-per-category-chart');
const barContainer = document.getElementById('members-per-group-chart');
const $months = $('#months-select');
const cache = { postsPerMonth: null, postsPerCategory: null, membersPerGroup: null };

const MONTH_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const formatMonth = (key) => MONTH_FORMAT.format(new Date(`${key}-01T00:00:00Z`));

function showError(container, error) {
  $(container).html(`<p class="error">${escapeHtml(error.message)}</p>`);
}

function drawPostsPerMonth() {
  if (!cache.postsPerMonth) return;
  renderLineChart(lineContainer, cache.postsPerMonth, {
    x: (d) => d.month,
    y: (d) => d.count,
    formatX: formatMonth,
    label: 'Number of posts per month',
  });
}

function drawPostsPerCategory() {
  if (!cache.postsPerCategory) return;
  const { items, profilePosts } = cache.postsPerCategory;
  renderPieChart(pieContainer, items, {
    label: (d) => d.category,
    value: (d) => d.count,
    centerCaption: 'group posts',
    ariaLabel: 'Share of group posts by group topic',
    footnote:
      profilePosts > 0 ? `Plus ${profilePosts} profile posts that are not in any group.` : '',
  });
}

function drawMembersPerGroup() {
  if (!cache.membersPerGroup) return;
  renderHorizontalBarChart(barContainer, cache.membersPerGroup, {
    label: (d) => d.name,
    value: (d) => d.memberCount,
    unit: 'members',
    ariaLabel: 'Groups ranked by number of members',
  });
}

async function loadPostsPerMonth() {
  try {
    const { items } = await api.get('/api/stats/posts-per-month', { months: $months.val() });
    cache.postsPerMonth = items;
    drawPostsPerMonth();
  } catch (error) {
    showError(lineContainer, error);
  }
}

async function loadPostsPerCategory() {
  try {
    cache.postsPerCategory = await api.get('/api/stats/posts-per-category');
    drawPostsPerCategory();
  } catch (error) {
    showError(pieContainer, error);
  }
}

async function loadMembersPerGroup() {
  try {
    const { items } = await api.get('/api/stats/members-per-group', { limit: 10 });
    cache.membersPerGroup = items;
    drawMembersPerGroup();
  } catch (error) {
    showError(barContainer, error);
  }
}

let resizeTimer = null;
$(window).on('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawPostsPerMonth();
    drawPostsPerCategory();
    drawMembersPerGroup();
  }, 200);
});

$months.on('change', loadPostsPerMonth);

loadPostsPerMonth();
loadPostsPerCategory();
loadMembersPerGroup();
