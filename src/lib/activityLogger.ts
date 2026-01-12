import ActivityLog from '../models/ActivityLog';
import { Types } from 'mongoose';

export interface ActivityLogData {
  userId: Types.ObjectId | string;
  userType: 'admin' | 'user';
  entityType: 'book' | 'ebook' | 'component' | 'team' | 'poster' | 'purchase' | 'user' | 'recruitment' | 'chat' | 'project' | 'notification';
  entityId?: Types.ObjectId | string;
  action: 'created' | 'updated' | 'deleted' | 'purchased' | 'downloaded' | 'registered' | 'login' | 'logout' | 'viewed' | 'uploaded' | 'submitted';
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Centralized activity logging utility
 */
export class ActivityLogger {
  /**
   * Log an activity to the database
   */
  static async log(data: ActivityLogData): Promise<void> {
    try {
      const activityLog = new ActivityLog({
        userId: data.userId,
        userType: data.userType,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        description: data.description,
        metadata: data.metadata || {}
      });

      await activityLog.save();
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to prevent breaking main functionality
    }
  }

  /**
   * Log user registration
   */
  static async logUserRegistration(userId: Types.ObjectId | string, userEmail: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'user',
      entityId: userId,
      action: 'registered',
      description: `New user registered: ${userEmail}`,
      metadata
    });
  }

  /**
   * Log user login
   */
  static async logUserLogin(userId: Types.ObjectId | string, userEmail: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'user',
      entityId: userId,
      action: 'login',
      description: `User logged in: ${userEmail}`,
      metadata
    });
  }

  /**
   * Log user logout
   */
  static async logUserLogout(userId: Types.ObjectId | string, userEmail: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'user',
      entityId: userId,
      action: 'logout',
      description: `User logged out: ${userEmail}`,
      metadata
    });
  }

  /**
   * Log book purchase
   */
  static async logBookPurchase(userId: Types.ObjectId | string, bookId: Types.ObjectId | string, bookTitle: string, amount: number, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'purchase',
      entityId: bookId,
      action: 'purchased',
      description: `Purchased book: ${bookTitle} for ₹${amount}`,
      metadata: { ...metadata, amount, bookTitle }
    });
  }

  /**
   * Log ebook download
   */
  static async logEbookDownload(userId: Types.ObjectId | string, ebookId: Types.ObjectId | string, ebookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'ebook',
      entityId: ebookId,
      action: 'downloaded',
      description: `Downloaded ebook: ${ebookTitle}`,
      metadata: { ...metadata, ebookTitle }
    });
  }

  /**
   * Log admin book creation
   */
  static async logBookCreation(adminId: Types.ObjectId | string, bookId: Types.ObjectId | string, bookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'book',
      entityId: bookId,
      action: 'created',
      description: `Created book: ${bookTitle}`,
      metadata: { ...metadata, bookTitle }
    });
  }

  /**
   * Log admin book update
   */
  static async logBookUpdate(adminId: Types.ObjectId | string, bookId: Types.ObjectId | string, bookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'book',
      entityId: bookId,
      action: 'updated',
      description: `Updated book: ${bookTitle}`,
      metadata: { ...metadata, bookTitle }
    });
  }

  /**
   * Log admin book deletion
   */
  static async logBookDeletion(adminId: Types.ObjectId | string, bookId: Types.ObjectId | string, bookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'book',
      entityId: bookId,
      action: 'deleted',
      description: `Deleted book: ${bookTitle}`,
      metadata: { ...metadata, bookTitle }
    });
  }

  /**
   * Log admin ebook creation
   */
  static async logEbookCreation(adminId: Types.ObjectId | string, ebookId: Types.ObjectId | string, ebookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'ebook',
      entityId: ebookId,
      action: 'created',
      description: `Created ebook: ${ebookTitle}`,
      metadata: { ...metadata, ebookTitle }
    });
  }

  /**
   * Log admin ebook update
   */
  static async logEbookUpdate(adminId: Types.ObjectId | string, ebookId: Types.ObjectId | string, ebookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'ebook',
      entityId: ebookId,
      action: 'updated',
      description: `Updated ebook: ${ebookTitle}`,
      metadata: { ...metadata, ebookTitle }
    });
  }

  /**
   * Log admin ebook deletion
   */
  static async logEbookDeletion(adminId: Types.ObjectId | string, ebookId: Types.ObjectId | string, ebookTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'ebook',
      entityId: ebookId,
      action: 'deleted',
      description: `Deleted ebook: ${ebookTitle}`,
      metadata: { ...metadata, ebookTitle }
    });
  }

  /**
   * Log admin poster creation
   */
  static async logPosterCreation(adminId: Types.ObjectId | string, posterId: Types.ObjectId | string, posterTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'poster',
      entityId: posterId,
      action: 'created',
      description: `Created poster: ${posterTitle}`,
      metadata: { ...metadata, posterTitle }
    });
  }

  /**
   * Log admin poster update
   */
  static async logPosterUpdate(adminId: Types.ObjectId | string, posterId: Types.ObjectId | string, posterTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'poster',
      entityId: posterId,
      action: 'updated',
      description: `Updated poster: ${posterTitle}`,
      metadata: { ...metadata, posterTitle }
    });
  }

  /**
   * Log admin poster deletion
   */
  static async logPosterDeletion(adminId: Types.ObjectId | string, posterId: Types.ObjectId | string, posterTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'poster',
      entityId: posterId,
      action: 'deleted',
      description: `Deleted poster: ${posterTitle}`,
      metadata: { ...metadata, posterTitle }
    });
  }

  /**
   * Log admin team member creation
   */
  static async logTeamMemberCreation(adminId: Types.ObjectId | string, teamMemberId: Types.ObjectId | string, memberName: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'team',
      entityId: teamMemberId,
      action: 'created',
      description: `Added team member: ${memberName}`,
      metadata: { ...metadata, memberName }
    });
  }

  /**
   * Log admin team member update
   */
  static async logTeamMemberUpdate(adminId: Types.ObjectId | string, teamMemberId: Types.ObjectId | string, memberName: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'team',
      entityId: teamMemberId,
      action: 'updated',
      description: `Updated team member: ${memberName}`,
      metadata: { ...metadata, memberName }
    });
  }

  /**
   * Log admin team member deletion
   */
  static async logTeamMemberDeletion(adminId: Types.ObjectId | string, teamMemberId: Types.ObjectId | string, memberName: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'team',
      entityId: teamMemberId,
      action: 'deleted',
      description: `Removed team member: ${memberName}`,
      metadata: { ...metadata, memberName }
    });
  }

  /**
   * Log recruitment form submission
   */
  static async logRecruitmentSubmission(userId: Types.ObjectId | string, formId: Types.ObjectId | string, formTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'recruitment',
      entityId: formId,
      action: 'submitted',
      description: `Submitted recruitment form: ${formTitle}`,
      metadata: { ...metadata, formTitle }
    });
  }

  /**
   * Log chat message
   */
  static async logChatMessage(userId: Types.ObjectId | string, messageId: Types.ObjectId | string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userType: 'user',
      entityType: 'chat',
      entityId: messageId,
      action: 'created',
      description: `Sent a chat message`,
      metadata
    });
  }

  /**
   * Log project item creation
   */
  static async logProjectCreation(adminId: Types.ObjectId | string, projectId: Types.ObjectId | string, projectTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'project',
      entityId: projectId,
      action: 'created',
      description: `Created project: ${projectTitle}`,
      metadata: { ...metadata, projectTitle }
    });
  }

  /**
   * Log project item update
   */
  static async logProjectUpdate(adminId: Types.ObjectId | string, projectId: Types.ObjectId | string, projectTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'project',
      entityId: projectId,
      action: 'updated',
      description: `Updated project: ${projectTitle}`,
      metadata: { ...metadata, projectTitle }
    });
  }

  /**
   * Log project item deletion
   */
  static async logProjectDeletion(adminId: Types.ObjectId | string, projectId: Types.ObjectId | string, projectTitle: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminId,
      userType: 'admin',
      entityType: 'project',
      entityId: projectId,
      action: 'deleted',
      description: `Deleted project: ${projectTitle}`,
      metadata: { ...metadata, projectTitle }
    });
  }
}

export default ActivityLogger;