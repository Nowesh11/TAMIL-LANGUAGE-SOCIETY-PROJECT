import mongoose, { Schema, Document, Types } from 'mongoose';

// Base interface for bilingual content
export interface IBilingualContent {
  en: string;
  ta: string;
}

// Interface for image content
export interface IImageContent {
  src: string;
  alt: IBilingualContent;
  width?: number;
  height?: number;
}

// Interface for link content
export interface ILinkContent {
  text: IBilingualContent;
  url: string;
  target?: '_blank' | '_self';
}

// Interface for button content
export interface IButtonContent {
  text: IBilingualContent;
  url: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  target?: '_blank' | '_self';
}

// Interface for hero component content
export interface IHeroContent {
  title: IBilingualContent;
  subtitle?: IBilingualContent;
  description?: IBilingualContent;
  backgroundImages?: IImageContent[];
  backgroundVideo?: string;
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  buttons?: IButtonContent[];
  alignment?: 'left' | 'center' | 'right';
}

// Interface for banner component content
export interface IBannerContent {
  title: IBilingualContent;
  message?: IBilingualContent;
  type?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  icon?: string;
  button?: IButtonContent;
}

// Interface for text component content
export interface ITextContent {
  title?: IBilingualContent;
  content: IBilingualContent;
  format?: 'plain' | 'markdown' | 'html';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

// Interface for image component content
export interface IImageComponentContent {
  image: IImageContent;
  caption?: IBilingualContent;
  link?: ILinkContent;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
}

// Interface for gallery component content
export interface IGalleryContent {
  title?: IBilingualContent;
  images: IImageContent[];
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4 | 5;
  showThumbnails?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
}

// Interface for testimonial content
export interface ITestimonialContent {
  quote: IBilingualContent;
  author: {
    name: IBilingualContent;
    title?: IBilingualContent;
    company?: IBilingualContent;
    avatar?: IImageContent;
  };
  rating?: number;
}

// Interface for testimonials component content
export interface ITestimonialsContent {
  title?: IBilingualContent;
  testimonials: ITestimonialContent[];
  layout?: 'single' | 'grid' | 'carousel';
  showRating?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
}

// Interface for stats component content
export interface IStatsContent {
  title?: IBilingualContent;
  stats: {
    label: IBilingualContent;
    value: string;
    suffix?: string;
    icon?: string;
    color?: string;
  }[];
  layout?: 'horizontal' | 'grid';
  animated?: boolean;
}

// Interface for features component content
export interface IFeaturesContent {
  title?: IBilingualContent;
  subtitle?: IBilingualContent;
  features: {
    title: IBilingualContent;
    description: IBilingualContent;
    icon?: string;
    image?: IImageContent;
    link?: ILinkContent;
  }[];
  layout?: 'grid' | 'list' | 'cards';
  columns?: 2 | 3 | 4;
}

// Interface for CTA (Call to Action) component content
export interface ICTAContent {
  title: IBilingualContent;
  subtitle?: IBilingualContent;
  description?: IBilingualContent;
  buttons: IButtonContent[];
  backgroundImages?: IImageContent[];
  backgroundColor?: string;
  textColor?: string;
}

// Interface for FAQ component content
export interface IFAQContent {
  title?: IBilingualContent;
  faqs: {
    question: IBilingualContent;
    answer: IBilingualContent;
    category?: string;
  }[];
  searchable?: boolean;
  categories?: string[];
}

// Interface for contact form component content
export interface IContactFormContent {
  title?: IBilingualContent;
  subtitle?: IBilingualContent;
  fields: {
    name: string;
    label: IBilingualContent;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
    required: boolean;
    placeholder?: IBilingualContent;
    options?: { label: IBilingualContent; value: string }[];
  }[];
  submitButton: IBilingualContent;
  successMessage: IBilingualContent;
  errorMessage: IBilingualContent;
}

// Interface for newsletter component content
export interface INewsletterContent {
  title: IBilingualContent;
  subtitle?: IBilingualContent;
  placeholder: IBilingualContent;
  buttonText: IBilingualContent;
  privacyText?: IBilingualContent;
  successMessage: IBilingualContent;
  errorMessage: IBilingualContent;
}

// Interface for social links component content
export interface ISocialLinksContent {
  title?: IBilingualContent;
  links: {
    platform: string;
    url: string;
    icon: string;
    label?: IBilingualContent;
  }[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLabels?: boolean;
}

// Interface for video component content
export interface IVideoContent {
  title?: IBilingualContent;
  videoUrl: string;
  thumbnailImage?: IImageContent;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

// Interface for countdown component content
export interface ICountdownContent {
  title: IBilingualContent;
  subtitle?: IBilingualContent;
  targetDate: Date;
  timezone?: string;
  labels: {
    days: IBilingualContent;
    hours: IBilingualContent;
    minutes: IBilingualContent;
    seconds: IBilingualContent;
  };
  expiredMessage: IBilingualContent;
}

// Interface for SEO component content
export interface ISeoComponentContent {
  title: IBilingualContent;
  description?: IBilingualContent;
  keywords?: string[];
}

// Interface for timeline component content
export interface ITimelineItem {
  year: string;
  title?: IBilingualContent;
  description: IBilingualContent;
  image?: IImageContent;
}

export interface ITimelineContent {
  title?: IBilingualContent;
  items: ITimelineItem[];
  layout?: 'vertical' | 'horizontal';
}

// Interface for navbar component content
export interface INavbarContent {
  themeToggle?: boolean;
  logo?: {
    image?: IImageContent;
    text?: IBilingualContent;
  };
  menu: {
    label: IBilingualContent;
    href: string;
    active?: boolean;
    variant?: 'link' | 'glass' | 'neon';
    dataKey?: string;
    testId?: string;
    isNotification?: boolean;
  }[];
  languageToggle?: {
    enabled: boolean;
    languages: ('en' | 'ta')[];
    defaultLang?: 'en' | 'ta';
  };
  hamburger?: boolean;
}

// Interface for footer component content
export interface IFooterContent {
  logo?: {
    image?: IImageContent;
    text?: IBilingualContent;
  };
  description?: IBilingualContent;
  socialLinks?: {
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
  };
  quickLinks?: {
    aboutLink?: ILinkContent;
    projectsLink?: ILinkContent;
    ebooksLink?: ILinkContent;
    bookstoreLink?: ILinkContent;
  };
  supportLinks?: {
    contactLink?: ILinkContent;
    notificationsLink?: ILinkContent;
  };
  newsletter?: {
    title?: IBilingualContent;
    description?: IBilingualContent;
    emailPlaceholder?: IBilingualContent;
    buttonIcon?: string;
  };
  copyright?: IBilingualContent;
}

// Union type for all component content types
export type ComponentContent = 
  | IHeroContent
  | IBannerContent
  | ITextContent
  | IImageComponentContent
  | IGalleryContent
  | ITestimonialsContent
  | IStatsContent
  | IFeaturesContent
  | ICTAContent
  | IFAQContent
  | IContactFormContent
  | INewsletterContent
  | ISocialLinksContent
  | IVideoContent
  | ICountdownContent
  | INavbarContent
  | IFooterContent
  | ISeoComponentContent
  | ITimelineContent;

// TypeScript interface for Component document
export interface IComponent extends Document {
  _id: Types.ObjectId;
  type: 'hero' | 'banner' | 'text' | 'image' | 'gallery' | 'testimonials' | 'stats' | 'features' | 'cta' | 'faq' | 'contact-form' | 'newsletter' | 'social-links' | 'video' | 'countdown' | 'navbar' | 'footer' | 'seo' | 'timeline';
  page: string;
  // Optional bureau filter for components to support bureau-specific content
  bureau?: 'sports_leadership' | 'education_intellectual' | 'arts_culture' | 'social_welfare_voluntary' | 'language_literature';
  content: ComponentContent;
  order: number;
  isActive: boolean;
  slug?: string;
  cssClasses?: string[];
  customStyles?: Record<string, unknown>;
  visibility?: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'none';
    duration: number;
    delay: number;
  };
  seo?: {
    title?: IBilingualContent;
    description?: IBilingualContent;
    keywords?: string[];
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Bilingual content schema
const BilingualContentSchema = new Schema({
  en: {
    type: String,
    required: [true, 'English content is required'],
    trim: true
  },
  ta: {
    type: String,
    required: [true, 'Tamil content is required'],
    trim: true
  }
}, { _id: false });



// Component schema definition
const ComponentSchema = new Schema<IComponent>({
  type: {
    type: String,
    required: [true, 'Component type is required'],
    enum: {
      values: ['hero', 'banner', 'text', 'image', 'gallery', 'testimonials', 'stats', 'features', 'cta', 'faq', 'contact-form', 'newsletter', 'social-links', 'video', 'countdown', 'navbar', 'footer', 'seo', 'timeline'],
      message: 'Invalid component type'
    },
    index: true
  },
  page: {
    type: String,
    required: [true, 'Page is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  bureau: {
    type: String,
    trim: true,
    lowercase: true,
    enum: {
      values: ['sports_leadership', 'education_intellectual', 'arts_culture', 'social_welfare_voluntary', 'language_literature'],
      message: 'Invalid bureau'
    },
    index: true,
    sparse: true
  },
  content: {
    type: Schema.Types.Mixed,
    required: [true, 'Component content is required'],
    validate: {
      validator: function(content: ComponentContent) {
        // Basic validation - ensure content is an object
        return content && typeof content === 'object';
      },
      message: 'Component content must be a valid object'
    }
  },
  order: {
    type: Number,
    required: [true, 'Component order is required'],
    min: [0, 'Order must be non-negative'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
    sparse: true
  },
  cssClasses: [{
    type: String,
    trim: true
  }],
  customStyles: {
    type: Schema.Types.Mixed
  },
  visibility: {
    desktop: {
      type: Boolean,
      default: true
    },
    tablet: {
      type: Boolean,
      default: true
    },
    mobile: {
      type: Boolean,
      default: true
    }
  },
  animation: {
    type: {
      type: String,
      enum: ['fade', 'slide', 'zoom', 'bounce', 'none'],
      default: 'none'
    },
    duration: {
      type: Number,
      min: [0, 'Animation duration must be non-negative'],
      default: 300
    },
    delay: {
      type: Number,
      min: [0, 'Animation delay must be non-negative'],
      default: 0
    }
  },
  seo: {
    title: BilingualContentSchema,
    description: BilingualContentSchema,
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ComponentSchema.index({ page: 1, isActive: 1, order: 1 });
ComponentSchema.index({ type: 1, isActive: 1 });
ComponentSchema.index({ createdBy: 1, createdAt: -1 });
ComponentSchema.index({ page: 1, type: 1, isActive: 1 });
ComponentSchema.index({ page: 1, bureau: 1, type: 1, isActive: 1 });

// Targeted indexes for better performance
ComponentSchema.index({ 'visibility.desktop': 1, 'visibility.tablet': 1, 'visibility.mobile': 1 });

// Virtual to populate creator information
ComponentSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate updater information
ComponentSchema.virtual('updater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for component age
ComponentSchema.virtual('componentAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get components by page
ComponentSchema.statics.getByPage = function(page: string, activeOnly: boolean = true) {
  const query: Record<string, unknown> = { page };
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
};

// Static method to get components by type
ComponentSchema.statics.getByType = function(type: string, activeOnly: boolean = true) {
  const query: Record<string, unknown> = { type };
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query)
    .sort({ page: 1, order: 1 })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
};

// Static method to reorder components
ComponentSchema.statics.reorderComponents = async function(page: string, componentIds: string[]) {
  // Validate ObjectIds
  const invalidIds = componentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new Error(`Invalid ObjectIds: ${invalidIds.join(', ')}`);
  }
  
  const bulkOps = componentIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, page },
      update: { order: index }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

// Instance method to duplicate component
ComponentSchema.methods.duplicate = function(newPage?: string) {
  const duplicateData = this.toObject();
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  if (newPage) {
    // Sanitize newPage to prevent XSS
    duplicateData.page = newPage.replace(/[<>"'&]/g, '');
  }
  
  // Append "Copy" to any titles in content
  if (duplicateData.content && typeof duplicateData.content === 'object') {
    const content = duplicateData.content as unknown as Record<string, unknown>;
    const title = content.title as IBilingualContent | undefined;
    if (title && typeof title === 'object' && 'en' in title && 'ta' in title) {
      // Sanitize existing title content to prevent XSS
      title.en = title.en.replace(/[<>"'&]/g, '') + ' (Copy)';
      title.ta = title.ta.replace(/[<>"'&]/g, '') + ' (நகல்)';
    }
  }
  
  return new (this.constructor as mongoose.Model<IComponent>)(duplicateData);
};

// Pre-save middleware to generate slug if not provided
ComponentSchema.pre('save', function(next) {
  if (!this.slug && this.content && typeof this.content === 'object') {
    const content = this.content as unknown as Record<string, unknown>;
    const title = content.title as IBilingualContent | undefined;
    if (title && typeof title === 'object' && 'en' in title && typeof title.en === 'string') {
      // Sanitize input to prevent XSS
      const sanitizedTitle = title.en.replace(/[<>"'&]/g, '');
      this.slug = sanitizedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }
  next();
});

// Pre-save middleware to set updatedBy
ComponentSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified() && !this.updatedBy) {
    // In a real application, you would get the current user from the request context
    // For now, we'll leave it undefined and let the application layer handle it
  }
  next();
});

// Pre-save middleware to validate content based on type
ComponentSchema.pre('save', function(next) {
  try {
    const content = this.content as unknown as Record<string, unknown>;
    
    // Type-specific validation
    switch (this.type) {
      case 'hero':
        const heroTitle = content.title as IBilingualContent | undefined;
        if (!heroTitle || !heroTitle.en || !heroTitle.ta) {
          return next(new Error('Hero component must have a title in both languages'));
        }
        break;
      case 'banner':
        const bannerTitle = content.title as IBilingualContent | undefined;
        if (!bannerTitle || !bannerTitle.en || !bannerTitle.ta) {
          return next(new Error('Banner component must have a title in both languages'));
        }
        break;
      case 'text':
        const textContent = content.content as IBilingualContent | undefined;
        if (!textContent || !textContent.en || !textContent.ta) {
          return next(new Error('Text component must have content in both languages'));
        }
        break;
      case 'image':
        const imageContent = content.image as IImageContent | undefined;
        if (!imageContent || !imageContent.src) {
          return next(new Error('Image component must have an image source'));
        }
        break;
      case 'gallery':
        if (!content.images || !Array.isArray(content.images) || content.images.length === 0) {
          return next(new Error('Gallery component must have at least one image'));
        }
        break;
      case 'testimonials':
        if (!content.testimonials || !Array.isArray(content.testimonials) || content.testimonials.length === 0) {
          return next(new Error('Testimonials component must have at least one testimonial'));
        }
        break;
      case 'stats':
        if (!content.stats || !Array.isArray(content.stats) || content.stats.length === 0) {
          return next(new Error('Stats component must have at least one stat'));
        }
        break;
      case 'features':
        if (!content.features || !Array.isArray(content.features) || content.features.length === 0) {
          return next(new Error('Features component must have at least one feature'));
        }
        break;
      case 'cta':
        const ctaTitle = content.title as IBilingualContent | undefined;
        if (!ctaTitle || !ctaTitle.en || !ctaTitle.ta) {
          return next(new Error('CTA component must have a title in both languages'));
        }
        if (!content.buttons || !Array.isArray(content.buttons) || content.buttons.length === 0) {
          return next(new Error('CTA component must have at least one button'));
        }
        break;
      case 'faq':
        if (!content.faqs || !Array.isArray(content.faqs) || content.faqs.length === 0) {
          return next(new Error('FAQ component must have at least one FAQ'));
        }
        break;
      case 'contact-form':
        if (!content.fields || !Array.isArray(content.fields) || content.fields.length === 0) {
          return next(new Error('Contact form component must have at least one field'));
        }
        break;
      case 'newsletter':
        const newsletterTitle = content.title as IBilingualContent | undefined;
        if (!newsletterTitle || !newsletterTitle.en || !newsletterTitle.ta) {
          return next(new Error('Newsletter component must have a title in both languages'));
        }
        break;
      case 'social-links':
        if (!content.links || !Array.isArray(content.links) || content.links.length === 0) {
          return next(new Error('Social links component must have at least one link'));
        }
        break;
      case 'video':
        if (!content.videoUrl) {
          return next(new Error('Video component must have a video URL'));
        }
        break;
      case 'countdown':
        const countdownTitle = content.title as IBilingualContent | undefined;
        if (!countdownTitle || !countdownTitle.en || !countdownTitle.ta) {
          return next(new Error('Countdown component must have a title in both languages'));
        }
        if (!content.targetDate) {
          return next(new Error('Countdown component must have a target date'));
        }
        break;
      case 'navbar':
        if (!content.menu || !Array.isArray(content.menu) || content.menu.length === 0) {
          return next(new Error('Navbar must have at least one menu item'));
        }
        break;
      case 'footer':
        // Minimal validation to ensure presence of primary content
        const copyright = content.copyright as IBilingualContent | undefined;
        if (!copyright || !copyright.en || !copyright.ta) {
          return next(new Error('Footer must have copyright in both languages'));
        }
        break;
      case 'seo':
        const seoTitle = content.title as IBilingualContent | undefined;
        if (!seoTitle || !seoTitle.en || !seoTitle.ta) {
          return next(new Error('SEO component must have a title in both languages'));
        }
        // description is optional but if provided should be bilingual
        const seoDescription = content.description as IBilingualContent | undefined;
        if (seoDescription && (!seoDescription.en || !seoDescription.ta)) {
          return next(new Error('SEO description must be provided in both languages'));
        }
        break;
      case 'timeline':
        const items = content.items as ITimelineItem[] | undefined;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return next(new Error('Timeline component must have at least one item'));
        }
        for (const item of items) {
          if (!item.year || typeof item.year !== 'string') {
            return next(new Error('Timeline items must include a year'));
          }
          const itemDesc = item.description as IBilingualContent | undefined;
          if (!itemDesc || !itemDesc.en || !itemDesc.ta) {
            return next(new Error('Timeline item must have a description in both languages'));
          }
        }
        break;
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Export the model
const Component = mongoose.models.Component || mongoose.model<IComponent>('Component', ComponentSchema);
export default Component;
