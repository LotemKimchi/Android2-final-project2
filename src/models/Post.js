import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** null → a profile post visible to the author's friends. */
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    content: { type: String, trim: true, maxlength: 2000, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

postSchema.pre('validate', function requireSomeContent() {
  if (!this.content && !this.imageUrl && !this.videoUrl) {
    this.invalidate('content', 'A post needs text, an image or a video');
  }
});

export const Post = mongoose.model('Post', postSchema);
