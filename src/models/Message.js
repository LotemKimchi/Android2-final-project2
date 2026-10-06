import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
