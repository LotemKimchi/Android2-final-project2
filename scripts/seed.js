/**
 * Fills the database with demo users, friendships, groups, posts, likes and chat messages.
 *
 *   npm run seed            add the demo data (refuses if it is already there)
 *   npm run seed -- --reset remove the previous demo data first, then add it again
 *
 * Demo accounts share the password below and use the @seed.circles.local email domain, so they
 * can be told apart from real accounts and removed cleanly. An existing "lotem" account (if any)
 * is woven in as a friend / group member so the feed and chat have content.
 */
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { Group } from '../src/models/Group.js';
import { Message } from '../src/models/Message.js';
import { Post } from '../src/models/Post.js';
import { User } from '../src/models/User.js';
import { deleteAccount } from '../src/services/accountService.js';
import { hashPassword } from '../src/services/passwords.js';

const SEED_PASSWORD = 'circles123';
const SEED_EMAIL_DOMAIN = 'seed.circles.local';
const HOST_USERNAME = 'lotem';
const MONTHS_OF_POSTS = 14;

/** Deterministic PRNG (mulberry32) so every run produces the same data. */
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(20261001);
const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (items) => items[Math.floor(random() * items.length)];
const sample = (items, count) => [...items].sort(() => random() - 0.5).slice(0, count);

const PEOPLE = [
  {
    username: 'noa_cohen',
    displayName: 'נועה כהן',
    gender: 'female',
    city: 'Tel Aviv',
    age: 24,
    bio: 'Runner, coffee lover, frontend dev.',
  },
  {
    username: 'daniel_levi',
    displayName: 'דניאל לוי',
    gender: 'male',
    city: 'Haifa',
    age: 29,
    bio: 'Chess every evening. Ask me for a game.',
  },
  {
    username: 'maya_mizrahi',
    displayName: 'מאיה מזרחי',
    gender: 'female',
    city: 'Jerusalem',
    age: 21,
    bio: 'Computer science student.',
  },
  {
    username: 'yossi_peretz',
    displayName: 'יוסי פרץ',
    gender: 'male',
    city: 'Beer Sheva',
    age: 35,
    bio: 'Home cook and weekend traveller.',
  },
  {
    username: 'shira_avraham',
    displayName: 'שירה אברהם',
    gender: 'female',
    city: 'Tel Aviv',
    age: 27,
    bio: 'Guitar, piano and too many playlists.',
  },
  {
    username: 'omer_friedman',
    displayName: 'עומר פרידמן',
    gender: 'male',
    city: 'Netanya',
    age: 19,
    bio: 'Gamer. Mostly strategy games.',
  },
  {
    username: 'tamar_shapiro',
    displayName: 'תמר שפירא',
    gender: 'female',
    city: 'Haifa',
    age: 32,
    bio: 'Illustrator. Drawing every day.',
  },
  {
    username: 'eitan_biton',
    displayName: 'איתן ביטון',
    gender: 'male',
    city: 'Ashdod',
    age: 41,
    bio: 'Football coach for kids.',
  },
  {
    username: 'yael_katz',
    displayName: 'יעל כץ',
    gender: 'female',
    city: 'Jerusalem',
    age: 26,
    bio: 'Teacher. Loves board games.',
  },
  {
    username: 'alex_rosen',
    displayName: 'Alex Rosen',
    gender: 'other',
    city: 'Tel Aviv',
    age: 30,
    bio: 'Photographer and backpacker.',
  },
  {
    username: 'lior_dahan',
    displayName: 'ליאור דהן',
    gender: 'male',
    city: 'Rishon LeZion',
    age: 23,
    bio: 'Backend developer in training.',
  },
  {
    username: 'roni_golan',
    displayName: 'רוני גולן',
    gender: 'female',
    city: 'Herzliya',
    age: 38,
    bio: 'Marathon finisher x3.',
  },
];

/** Index pairs into PEOPLE. */
const FRIENDSHIPS = [
  [0, 2],
  [0, 4],
  [0, 9],
  [0, 11],
  [1, 5],
  [1, 8],
  [1, 10],
  [2, 8],
  [2, 10],
  [3, 7],
  [3, 9],
  [4, 6],
  [4, 9],
  [5, 10],
  [6, 9],
  [7, 11],
  [8, 11],
  [9, 10],
];
const HOST_FRIENDS = [0, 1, 2, 4, 6, 10];
const HOST_FRIEND_REQUESTS_FROM = [3, 9];

const GROUPS = [
  {
    name: 'Tel Aviv Runners',
    category: 'sports',
    privacy: 'public',
    owner: 11,
    members: [0, 4, 7, 9],
    host: 'member',
    description: 'Morning runs along the beach, every Tuesday and Friday.',
  },
  {
    name: 'Chess Lovers',
    category: 'gaming',
    privacy: 'private',
    owner: 1,
    members: [5, 8, 10],
    host: 'member',
    description: 'Puzzles, openings and friendly online games.',
  },
  {
    name: 'Web Developers IL',
    category: 'technology',
    privacy: 'public',
    owner: 10,
    members: [0, 2, 5, 9],
    host: 'member',
    description: 'Frontend, backend and everything in between.',
  },
  {
    name: 'Home Cooking',
    category: 'food',
    privacy: 'public',
    owner: 3,
    members: [4, 6, 8, 11],
    host: null,
    description: 'Share your favourite recipes and kitchen wins.',
  },
  {
    name: 'Weekend Hikers',
    category: 'travel',
    privacy: 'private',
    owner: 9,
    members: [3, 7, 11],
    host: 'pending',
    description: 'Trails all over the country. Members only.',
  },
  {
    name: 'Sketch Club',
    category: 'art',
    privacy: 'public',
    owner: 6,
    members: [4, 9],
    host: null,
    description: 'Post a sketch a week. All levels welcome.',
  },
  {
    name: 'Study Buddies',
    category: 'education',
    privacy: 'public',
    owner: 2,
    members: [5, 8, 10],
    host: 'member',
    description: 'Exam prep, summaries and motivation.',
  },
];

const PROFILE_POSTS = [
  'איזה יום יפה היום ☀️',
  'סוף סוף סיימתי את הפרויקט!',
  'מישהו ממליץ על ספר טוב לקיץ?',
  'Just finished a 10k run. Legs are gone.',
  'Coffee first, then everything else.',
  'שבוע עמוס, אבל מתקדמים 💪',
  'New week, new goals.',
  'מי בא להופעה ביום חמישי?',
  'Learning something new every day.',
  'Back from a short trip up north. Recommended!',
  'ערב סרטים עם חברים 🎬',
  'Does anyone else think Mondays should be optional?',
];

const GROUP_POSTS = {
  'Tel Aviv Runners': [
    'Who is joining Friday at 6:30?',
    'New personal best on the 5k!',
    'ריצה ארוכה מחר בבוקר, מי מצטרף?',
    'Remember to hydrate, it is going to be hot.',
  ],
  'Chess Lovers': [
    'Puzzle of the day: white to move and win.',
    'Anyone up for a blitz tournament?',
    'פתיחה סיציליאנית או פתיחת המלכה?',
  ],
  'Web Developers IL': [
    'Flexbox or Grid for a form layout? Discuss.',
    'Finally understood async/await.',
    'מישהו עבד עם Socket.io? יש לי שאלה',
    'Tip: never trust the client, always validate on the server.',
    'D3 scales are magic once they click.',
  ],
  'Home Cooking': [
    'Shakshuka recipe that never fails 🍳',
    'עוגת שוקולד בלי קמח, מושלמת',
    'What is your go-to weeknight dinner?',
  ],
  'Weekend Hikers': [
    'Nahal Amud this Saturday?',
    'מסלול מומלץ בגליל העליון',
    'Bring at least 3 liters of water.',
  ],
  'Sketch Club': [
    'This week: draw your favourite mug.',
    'סקיצה מהירה מבית הקפה',
    'Ink or pencil today?',
  ],
  'Study Buddies': [
    'Summary for the data structures exam is up.',
    'מי לומד מחר בספרייה?',
    'Pomodoro sessions tonight at 20:00.',
  ],
};

const CHAT_LINES = [
  [
    'היי! מה קורה?',
    'הכול טוב, ואצלך?',
    'סבבה, עובדת על הפרויקט',
    'בהצלחה! צריכה עזרה?',
    'אולי מחר, תודה 🙏',
  ],
  ['Did you see the new group?', 'Yes, joined already', 'Nice, see you there', '👍'],
  ['נפגשים מחר?', 'כן, ב-10 בבוקר', 'מעולה, אני אביא קפה ☕'],
];

function birthDateForAge(age) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - age, randomInt(0, 11), randomInt(1, 28)));
}

/** A random moment in the month `monthsAgo` months back; never in the future. */
function dateInMonth(monthsAgo) {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1);
  const end = Math.min(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1),
    now.getTime(),
  );
  return new Date(start + random() * (end - start));
}

/** Saves a document with a chosen createdAt instead of "now". */
async function saveAt(doc, createdAt) {
  doc.createdAt = createdAt;
  doc.updatedAt = createdAt;
  await doc.save({ timestamps: false });
  return doc;
}

async function removePreviousSeed() {
  const seeded = await User.find({
    email: new RegExp(`@${SEED_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`),
  });
  for (const user of seeded) await deleteAccount(user._id);
  return seeded.length;
}

async function seed() {
  const host = await User.findOne({ username: HOST_USERNAME });
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const users = await User.insertMany(
    PEOPLE.map(({ age, ...person }) => ({
      ...person,
      email: `${person.username}@${SEED_EMAIL_DOMAIN}`,
      birthDate: birthDateForAge(age),
      passwordHash,
    })),
  );
  const ids = users.map((user) => user._id);

  // Friendships are stored on both sides.
  const friendsOf = new Map(ids.map((id) => [String(id), []]));
  for (const [a, b] of FRIENDSHIPS) {
    friendsOf.get(String(ids[a])).push(ids[b]);
    friendsOf.get(String(ids[b])).push(ids[a]);
  }
  if (host) {
    for (const index of HOST_FRIENDS) friendsOf.get(String(ids[index])).push(host._id);
  }
  await Promise.all(
    ids.map((id) => User.updateOne({ _id: id }, { $set: { friends: friendsOf.get(String(id)) } })),
  );
  if (host) {
    await User.updateOne(
      { _id: host._id },
      {
        $addToSet: {
          friends: { $each: HOST_FRIENDS.map((i) => ids[i]) },
          friendRequests: { $each: HOST_FRIEND_REQUESTS_FROM.map((i) => ids[i]) },
        },
      },
    );
  }

  const groups = [];
  for (const spec of GROUPS) {
    const owner = ids[spec.owner];
    const members = [owner, ...spec.members.map((i) => ids[i])];
    if (host && spec.host === 'member') members.push(host._id);
    const group = new Group({
      name: spec.name,
      description: spec.description,
      category: spec.category,
      privacy: spec.privacy,
      owner,
      admins: [owner, ids[spec.members[0]]],
      members,
      pendingMembers: host && spec.host === 'pending' ? [host._id] : [],
    });
    groups.push(await saveAt(group, dateInMonth(MONTHS_OF_POSTS)));
  }

  // More posts in recent months, so the "posts per month" chart shows growth.
  let postCount = 0;
  for (let monthsAgo = MONTHS_OF_POSTS - 1; monthsAgo >= 0; monthsAgo -= 1) {
    const postsThisMonth = randomInt(3, 6) + Math.round((MONTHS_OF_POSTS - monthsAgo) * 0.8);
    for (let n = 0; n < postsThisMonth; n += 1) {
      const inGroup = random() < 0.55;
      const group = inGroup ? pick(groups) : null;
      const author = group ? pick(group.members) : pick(ids);
      const audience = group ? group.members : [...(friendsOf.get(String(author)) ?? ids)];
      const post = new Post({
        author,
        group: group?._id ?? null,
        content: group ? pick(GROUP_POSTS[group.name]) : pick(PROFILE_POSTS),
        likes: sample(audience, randomInt(0, Math.min(6, audience.length))),
      });
      await saveAt(post, dateInMonth(monthsAgo));
      postCount += 1;
    }
  }

  let messageCount = 0;
  if (host) {
    for (const [conversation, lines] of CHAT_LINES.entries()) {
      const friend = ids[HOST_FRIENDS[conversation]];
      const start = Date.now() - (conversation + 1) * 26 * 60 * 60 * 1000;
      for (const [index, text] of lines.entries()) {
        const [from, to] = index % 2 === 0 ? [friend, host._id] : [host._id, friend];
        await saveAt(new Message({ from, to, text }), new Date(start + index * 4 * 60 * 1000));
        messageCount += 1;
      }
    }
  }

  return {
    users: users.length,
    groups: groups.length,
    posts: postCount,
    messages: messageCount,
    host,
  };
}

async function main() {
  await connectDb();
  const reset = process.argv.includes('--reset');

  const existing = await User.countDocuments({
    email: new RegExp(`@${SEED_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`),
  });
  if (existing > 0 && !reset) {
    console.log(
      `Demo data already exists (${existing} demo users). Run "npm run seed -- --reset" to recreate it.`,
    );
    return;
  }
  if (reset)
    console.log(`Removed ${await removePreviousSeed()} previous demo users and their content.`);

  const result = await seed();
  console.log(
    `Added ${result.users} users, ${result.groups} groups, ${result.posts} posts, ${result.messages} messages.`,
  );
  console.log(`Demo login: any demo username (e.g. noa_cohen) with password "${SEED_PASSWORD}".`);
  if (!result.host)
    console.log(`No "${HOST_USERNAME}" account found, so nothing was linked to it.`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
