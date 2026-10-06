import mongoose from 'mongoose';

const { Schema } = mongoose;

export const GENDERS = ['male', 'female', 'other'];

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Only letters, numbers and underscores'],
    },
    passwordHash: { type: String, required: true, select: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    bio: { type: String, trim: true, maxlength: 300, default: '' },
    avatarUrl: { type: String, default: '' },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** Incoming friend requests (ids of users who asked to befriend this user). */
    friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

userSchema.index({ displayName: 1 });
userSchema.index({ friendRequests: 1 });

export const User = mongoose.model('User', userSchema);
