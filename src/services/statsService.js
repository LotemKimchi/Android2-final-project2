import { Group } from '../models/Group.js';
import { Post } from '../models/Post.js';
import { addUtcMonths, startOfUtcMonth, utcMonthKey } from '../utils/dates.js';

export async function countPostsPerMonth(months, now = new Date()) {
  const start = addUtcMonths(startOfUtcMonth(now), -(months - 1));
  const rows = await Post.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByMonth = new Map(
    rows.map(({ _id, count }) => [`${_id.year}-${String(_id.month).padStart(2, '0')}`, count]),
  );
  return Array.from({ length: months }, (_, index) => {
    const month = utcMonthKey(addUtcMonths(start, index));
    return { month, count: countByMonth.get(month) ?? 0 };
  });
}

/** Group posts counted by their group's category (largest first), plus the number of profile posts. */
export async function countPostsByCategory() {
  const [rows, profilePosts] = await Promise.all([
    Post.aggregate([
      { $match: { group: { $ne: null } } },
      // A post stores only its group's id; $lookup joins the group document to read its category.
      {
        $lookup: {
          from: Group.collection.name,
          localField: 'group',
          foreignField: '_id',
          as: 'group',
        },
      },
      { $unwind: '$group' },
      { $group: { _id: '$group.category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Post.countDocuments({ group: null }),
  ]);
  return { items: rows.map(({ _id, count }) => ({ category: _id, count })), profilePosts };
}

export function topGroupsByMembers(limit) {
  return Group.aggregate([
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        privacy: 1,
        memberCount: { $size: '$members' },
      },
    },
    { $sort: { memberCount: -1, name: 1 } },
    { $limit: limit },
  ]);
}
