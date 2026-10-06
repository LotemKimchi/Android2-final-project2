export function calculateAge(birthDate, now = new Date()) {
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Minimal identity used inside posts, messages, nav. */
export function toUserSummary(user) {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? '',
  };
}

/** What any logged-in user may see. */
export function toPublicUser(user) {
  return {
    ...toUserSummary(user),
    gender: user.gender,
    city: user.city,
    bio: user.bio,
    age: calculateAge(user.birthDate),
    friendCount: user.friends?.length ?? 0,
    createdAt: user.createdAt,
  };
}

/** Only for the user themself — includes private fields. */
export function toPrivateUser(user) {
  return {
    ...toPublicUser(user),
    email: user.email,
    birthDate: new Date(user.birthDate).toISOString().slice(0, 10),
  };
}
