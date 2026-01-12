import mongoose from 'mongoose';
import NotificationService from './notificationService';

/**
 * Notification triggers for automatic notification generation
 * These functions should be called from model middleware (pre/post hooks)
 */

export class NotificationTriggers {
  /**
   * Trigger for Book model operations
   */
  static async onBookChange(
    action: 'created' | 'updated' | 'deleted',
    bookData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      await NotificationService.createBookNotification(action, bookData, userId);
    } catch (error) {
      console.error('Error creating book notification:', error);
    }
  }

  /**
   * Trigger for EBook model operations
   */
  static async onEBookChange(
    action: 'created' | 'updated' | 'deleted',
    ebookData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      await NotificationService.createEBookNotification(action, ebookData, userId);
    } catch (error) {
      console.error('Error creating ebook notification:', error);
    }
  }

  /**
   * Trigger for Component model operations
   */
  static async onComponentChange(
    action: 'created' | 'updated' | 'deleted',
    componentData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      await NotificationService.createComponentNotification(action, componentData, userId);
    } catch (error) {
      console.error('Error creating component notification:', error);
    }
  }

  /**
   * Trigger for Poster operations (if you have a Poster model)
   */
  static async onPosterChange(
    action: 'created' | 'updated' | 'deleted',
    posterData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      await NotificationService.createPosterNotification(action, posterData, userId);
    } catch (error) {
      console.error('Error creating poster notification:', error);
    }
  }

  /**
   * Trigger for Project operations (if you have a Project model)
   */
  static async onProjectChange(
    action: 'created' | 'updated' | 'deleted',
    projectData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      await NotificationService.createProjectNotification(action, projectData, userId);
    } catch (error) {
      console.error('Error creating project notification:', error);
    }
  }

  /**
   * Trigger for User registration
   */
  static async onUserRegistration(userData: any) {
    try {
      // Create welcome notification for the new user
      await NotificationService.createNotification({
        title: { 
          en: 'Welcome to Tamil Language Society!', 
          ta: 'தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்!' 
        },
        message: { 
          en: 'Thank you for joining our community. Explore our digital library and participate in our cultural activities.', 
          ta: 'எங்கள் சமூகத்தில் சேர்ந்ததற்கு நன்றி. எங்கள் டிஜிட்டல் நூலகத்தை ஆராய்ந்து, எங்கள் கலாச்சார நடவடிக்கைகளில் பங்கேற்கவும்.' 
        },
        type: 'success',
        priority: 'medium',
        targetAudience: 'specific',
        userRef: userData._id,
        actionUrl: '/dashboard',
        actionText: { en: 'Explore Dashboard', ta: 'டாஷ்போர்டை ஆராயுங்கள்' },
        tags: ['welcome', 'registration'],
        sendEmail: true,
        createdBy: userData._id // Self-created for welcome message
      });

      // Create notification for admins about new user
      await NotificationService.createNotification({
        title: { 
          en: 'New Member Joined', 
          ta: 'புதிய உறுப்பினர் சேர்ந்துள்ளார்' 
        },
        message: { 
          en: `${userData.name.en} has joined the Tamil Language Society.`, 
          ta: `${userData.name.ta} தமிழ் மொழி சங்கத்தில் சேர்ந்துள்ளார்.` 
        },
        type: 'info',
        priority: 'low',
        targetAudience: 'admins',
        actionUrl: `/admin/users/${userData._id}`,
        actionText: { en: 'View Profile', ta: 'சுயவிவரத்தைப் பார்க்க' },
        tags: ['user', 'registration', 'admin'],
        sendEmail: false,
        createdBy: userData._id
      });
    } catch (error) {
      console.error('Error creating user registration notifications:', error);
    }
  }

  /**
   * Trigger for important system events
   */
  static async onSystemEvent(
    eventType: string,
    eventData: any,
    userId: mongoose.Types.ObjectId
  ) {
    try {
      const eventMessages = {
        'maintenance_scheduled': {
          title: { en: 'Maintenance Scheduled', ta: 'பராமரிப்பு திட்டமிடப்பட்டுள்ளது' },
          message: { en: 'System maintenance is scheduled. Some features may be unavailable.', ta: 'கணினி பராமரிப்பு திட்டமிடப்பட்டுள்ளது. சில அம்சங்கள் கிடைக்காமல் போகலாம்.' },
          type: 'warning' as const,
          priority: 'high' as const
        },
        'system_update': {
          title: { en: 'System Updated', ta: 'கணினி புதுப்பிக்கப்பட்டது' },
          message: { en: 'The system has been updated with new features and improvements.', ta: 'கணினி புதிய அம்சங்கள் மற்றும் மேம்பாடுகளுடன் புதுப்பிக்கப்பட்டுள்ளது.' },
          type: 'success' as const,
          priority: 'medium' as const
        },
        'backup_completed': {
          title: { en: 'Backup Completed', ta: 'காப்புப்பிரதி முடிந்தது' },
          message: { en: 'System backup has been completed successfully.', ta: 'கணினி காப்புப்பிரதி வெற்றிகரமாக முடிந்துள்ளது.' },
          type: 'info' as const,
          priority: 'low' as const
        }
      };

      const eventConfig = eventMessages[eventType as keyof typeof eventMessages];
      if (eventConfig) {
        await NotificationService.createNotification({
          ...eventConfig,
          targetAudience: 'admins',
          tags: ['system', eventType],
          sendEmail: eventConfig.priority === 'high',
          createdBy: userId
        });
      }
    } catch (error) {
      console.error('Error creating system event notification:', error);
    }
  }
}

export default NotificationTriggers;