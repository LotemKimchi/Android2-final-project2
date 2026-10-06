import {
  countPostsByCategory,
  countPostsPerMonth,
  topGroupsByMembers,
} from '../services/statsService.js';

export async function postsPerMonth(req, res) {
  res.json({ items: await countPostsPerMonth(req.valid.query.months) });
}

export async function postsPerCategory(req, res) {
  res.json(await countPostsByCategory());
}

export async function membersPerGroup(req, res) {
  res.json({ items: await topGroupsByMembers(req.valid.query.limit) });
}
