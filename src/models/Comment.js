import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true, required: true, maxlength: 500 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A post's comments are always read oldest → newest.
commentSchema.index({ post: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
