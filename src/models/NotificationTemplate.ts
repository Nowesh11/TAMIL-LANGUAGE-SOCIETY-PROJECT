import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

export interface INotificationTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  title: BilingualText;
  message: BilingualText;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true
  },
  title: {
    en: { type: String, required: true, trim: true },
    ta: { type: String, required: true, trim: true }
  },
  message: {
    en: { type: String, required: true, trim: true },
    ta: { type: String, required: true, trim: true }
  },
  type: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'success', 'error', 'announcement'],
    default: 'info'
  },
  category: {
    type: String,
    required: true,
    default: 'general'
  }
}, {
  timestamps: true
});

const NotificationTemplate = mongoose.models.NotificationTemplate || mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
export default NotificationTemplate;
