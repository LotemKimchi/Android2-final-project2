import mongoose from 'mongoose';

const { Schema } = mongoose;

export const GROUP_CATEGORIES = [
  'sports',
  'technology',
  'music',
  'gaming',
  'education',
  'travel',
  'food',
  'art',
  'other',
];
export const GROUP_PRIVACY = ['public', 'private'];

const userRefs = [{ type: Schema.Types.ObjectId, ref: 'User' }];

const groupSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    category: { type: String, enum: GROUP_CATEGORIES, required: true },
    privacy: { type: String, enum: GROUP_PRIVACY, default: 'public' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Invariant: owner ∈ admins ⊆ members. */
    admins: userRefs,
    members: userRefs,
    /** Join requests awaiting admin approval (private groups only). */
    pendingMembers: userRefs,
  },
  { timestamps: true },
);

groupSchema.index({ members: 1 });
groupSchema.index({ category: 1, privacy: 1 });

export const Group = mongoose.model('Group', groupSchema);
