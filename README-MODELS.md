# Tamil Language Society - Database Models

This document provides comprehensive information about all Mongoose models created for the Tamil Language Society application.

## Overview

The application uses MongoDB with Mongoose ODM and includes 14 different models with bilingual support (English and Tamil) for appropriate fields. All models include proper TypeScript types, validation, indexes, and comprehensive seed data.

## Models Structure

### 1. User Model (`src/models/User.ts`)

**Purpose**: Manages user accounts and authentication

**Key Features**:
- Bilingual name fields
- Role-based access control (admin/user)
- Purchase history tracking
- Password hashing with bcrypt
- Email validation

**Fields**:
- `email`: Unique email address
- `passwordHash`: Hashed password
- `name`: `{ en: String, ta: String }` - Bilingual name
- `role`: `'admin' | 'user'` - User role
- `purchases`: Array of Purchase references
- `isActive`: Boolean for account status
- `lastLogin`: Last login timestamp
- `createdAt`, `updatedAt`: Timestamps

### 2. Poster Model (`src/models/Poster.ts`)

**Purpose**: Manages promotional posters and announcements

**Key Features**:
- Bilingual title and description
- Image management
- Display ordering
- Active/inactive status

**Fields**:
- `title`: `{ en: String, ta: String }` - Bilingual title
- `description`: `{ en: String, ta: String }` - Bilingual description
- `imagePath`: Path to poster image
- `order`: Display order number
- `active`: Boolean for visibility
- `createdBy`: Reference to User model

### 4. Book Model (`src/models/Book.ts`)

**Purpose**: Manages physical book inventory and sales

**Key Features**:
- Bilingual metadata
- Inventory management
- Pricing and stock tracking
- Featured books system
- ISBN support

**Fields**:
- `title`: `{ en: String, ta: String }` - Bilingual title
- `author`: `{ en: String, ta: String }` - Bilingual author name
- `description`: `{ en: String, ta: String }` - Bilingual description
- `price`: Number - Book price
- `stock`: Number - Available quantity
- `coverPath`: Path to cover image
- `isbn`: Optional ISBN
- `category`: Book category
- `publishedYear`: Publication year
- `pages`: Number of pages
- `language`: Primary language
- `featured`: Boolean for featured status
- `active`: Boolean for availability
- `createdBy`: Reference to User model

### 5. EBook Model (`src/models/EBook.ts`)

**Purpose**: Manages digital book downloads

**Key Features**:
- File management
- Download tracking
- Format support
- File size tracking

**Fields**:
- `title`: `{ en: String, ta: String }` - Bilingual title
- `author`: `{ en: String, ta: String }` - Bilingual author name
- `description`: `{ en: String, ta: String }` - Bilingual description
- `filePath`: Path to ebook file
- `coverPath`: Path to cover image
- `fileSize`: File size in bytes
- `fileFormat`: File format (PDF, EPUB, etc.)
- `isbn`: Optional ISBN
- `category`: Book category
- `publishedYear`: Publication year
- `pages`: Number of pages
- `language`: Primary language
- `featured`: Boolean for featured status
- `active`: Boolean for availability
- `downloadCount`: Number of downloads
- `createdBy`: Reference to User model

### 6. ProjectItem Model (`src/models/ProjectItem.ts`)

**Purpose**: Manages projects, activities, and initiatives

**Key Features**:
- Type classification (project/activity/initiative)
- Bilingual content fields
- Image galleries
- Recruitment integration
- Progress tracking

**Fields**:
- `type`: `'project' | 'activity' | 'initiative'`
- `title`: `{ en: String, ta: String }` - Bilingual title
- `shortDesc`: `{ en: String, ta: String }` - Short description
- `fullDesc`: `{ en: String, ta: String }` - Full description
- `images`: Array of image paths
- `goals`: `{ en: String, ta: String }` - Project goals
- `achievement`: `{ en: String, ta: String }` - Achievements
- `directorName`: `{ en: String, ta: String }` - Director name
- `location`: `{ en: String, ta: String }` - Location
- `recruitmentFormId`: Optional reference to RecruitmentForm
- `status`: `'planning' | 'active' | 'completed' | 'on_hold'`
- `startDate`, `endDate`: Project timeline
- `budget`: Project budget
- `participants`: Number of participants
- `featured`: Boolean for featured status
- `active`: Boolean for visibility
- `createdBy`: Reference to User model

### 7. RecruitmentForm Model (`src/models/RecruitmentForm.ts`)

**Purpose**: Manages dynamic recruitment forms

**Key Features**:
- Dynamic field structure
- Bilingual form fields
- Response limits
- Email notifications
- Form validation

**Fields**:
- `title`: `{ en: String, ta: String }` - Form title
- `description`: `{ en: String, ta: String }` - Form description
- `role`: `'crew' | 'participants' | 'volunteer'`
- `fields`: Array of dynamic form fields
- `active`: Boolean for form availability
- `startDate`, `endDate`: Form availability period
- `maxResponses`: Maximum number of responses
- `currentResponses`: Current response count
- `emailNotification`: Boolean for email alerts
- `createdBy`: Reference to User model

### 8. RecruitmentResponse Model (`src/models/RecruitmentResponse.ts`)

**Purpose**: Stores recruitment form submissions

**Key Features**:
- Dynamic answer storage
- Application tracking
- Review system
- Status management

**Fields**:
- `formRef`: Reference to RecruitmentForm
- `projectItemRef`: Reference to ProjectItem
- `roleApplied`: Applied role
- `answers`: Dynamic key-value pairs
- `applicantDetails`: Contact information
- `userRef`: Optional reference to User
- `status`: `'pending' | 'reviewed' | 'accepted' | 'rejected'`
- `reviewNotes`: Admin review notes
- `reviewedBy`: Reference to reviewing admin
- `reviewedAt`: Review timestamp

### 9. Notification Model (`src/models/Notification.ts`)

**Purpose**: Manages user notifications and announcements

**Key Features**:
- Bilingual messages
- Targeted notifications
- Email integration
- Priority levels
- Action buttons

**Fields**:
- `userRef`: Optional user reference (null for public)
- `title`: `{ en: String, ta: String }` - Notification title
- `message`: `{ en: String, ta: String }` - Notification message
- `type`: Notification type
- `priority`: `'low' | 'medium' | 'high'`
- `startAt`, `endAt`: Display period
- `sendEmail`: Boolean for email sending
- `isRead`: Boolean for read status
- `readAt`: Read timestamp
- `actionText`: `{ en: String, ta: String }` - Action button text
- `actionUrl`: Action URL
- `imageUrl`: Optional image
- `targetAudience`: `'all' | 'members' | 'admins'`
- `tags`: Array of tags
- `createdBy`: Reference to User model

### 10. FileRecord Model (`src/models/FileRecord.ts`)

**Purpose**: Tracks uploaded files and documents

**Key Features**:
- File metadata tracking
- Category classification
- Download counting
- Search functionality
- File validation

**Fields**:
- `path`: File path
- `filename`: Generated filename
- `originalName`: Original filename
- `mimeType`: MIME type
- `size`: File size in bytes
- `category`: Auto-detected category
- `description`: File description
- `tags`: Array of tags
- `isPublic`: Boolean for public access
- `downloadCount`: Download counter
- `checksum`: File checksum
- `metadata`: Additional metadata object
- `createdBy`: Reference to User model

### 11. Purchase Model (`src/models/Purchase.ts`)

**Purpose**: Manages book purchase transactions

**Key Features**:
- Order management
- Payment tracking
- Shipping details
- Refund handling
- Status tracking

**Fields**:
- `userRef`: Reference to User
- `bookRef`: Reference to Book
- `quantity`: Ordered quantity
- `unitPrice`: Price per unit
- `totalAmount`: Total before shipping
- `shippingFee`: Shipping cost
- `finalAmount`: Total amount
- `status`: Order status
- `paymentDetails`: Payment information object
- `shippingAddress`: Shipping address object
- `trackingNumber`: Optional tracking number
- `shippedAt`: Shipping timestamp
- `deliveredAt`: Delivery timestamp
- `refundDetails`: Refund information object

### 12. PaymentSettings Model (`src/models/PaymentSettings.ts`)

**Purpose**: Stores payment configuration and settings

**Key Features**:
- Multiple payment methods
- Shipping configuration
- Tax settings
- Maintenance mode
- Policy links

**Fields**:
- `epayum`: Epayum payment configuration
- `fbx`: FBX payment configuration
- `shipping`: Shipping settings object
- `taxRate`: Tax percentage
- `currency`: Default currency
- `isMaintenanceMode`: Maintenance mode flag
- `supportEmail`: Support contact email
- `supportPhone`: Support phone number
- `termsAndConditions`: Terms text
- `privacyPolicy`: Privacy policy text
- `refundPolicy`: Refund policy text

### 13. Team Model (`src/models/Team.ts`)

**Purpose**: Manages team member profiles

**Key Features**:
- Bilingual profiles
- Role hierarchy
- Social media links
- Achievement tracking
- Department organization

**Fields**:
- `name`: `{ en: String, ta: String }` - Bilingual name
- `role`: Team role
- `slug`: URL-friendly identifier
- `bio`: `{ en: String, ta: String }` - Bilingual biography
- `email`: Contact email
- `phone`: Contact phone
- `orderNum`: Display order
- `isActive`: Boolean for visibility
- `imagePath`: Profile image path
- `socialLinks`: Social media links object
- `department`: Department name
- `joinedDate`: Join date
- `achievements`: Array of achievements
- `specializations`: Array of specializations
- `languages`: Array of spoken languages

### 14. ChatMessage Model (`src/models/ChatMessage.ts`)

**Purpose**: Manages one-to-one chat functionality

**Key Features**:
- Real-time messaging
- File attachments
- Message reactions
- Read receipts
- Message editing

**Fields**:
- `senderId`: Reference to sender User
- `recipientId`: Reference to recipient User
- `message`: Message content
- `messageType`: `'text' | 'image' | 'file' | 'audio' | 'video'`
- `fileMetadata`: File information object
- `conversationId`: Generated conversation identifier
- `isRead`: Boolean for read status
- `readAt`: Read timestamp
- `isDelivered`: Boolean for delivery status
- `deliveredAt`: Delivery timestamp
- `isDeleted`: Boolean for soft delete
- `deletedAt`: Deletion timestamp
- `replyTo`: Reference to replied message
- `reactions`: Array of user reactions
- `editHistory`: Array of edit records

## Indexes

All models include appropriate indexes for:
- Primary queries (user lookups, active items)
- Text search (where applicable)
- Compound indexes for complex queries
- Unique constraints where needed

## Seed Data

Comprehensive seed data is provided in `src/lib/seedData.ts` including:

- **3 Users**: Admin, President, and regular member
- **1 Poster**: Cultural Festival 2024
- **2 Books**: Tamil Literature Classics and Modern Tamil Poetry
- **1 EBook**: Digital Tamil Grammar Guide
- **3 Project Items**: 1 project, 1 activity, 1 initiative
- **1 Recruitment Form**: Volunteer registration with dynamic fields
- **2 Team Members**: President and Vice President
- **2 File Records**: Brochure and banner
- **2 Notifications**: Welcome and event registration
- **1 Payment Settings**: Complete payment configuration
- **Sample data**: Purchase, recruitment response, and chat messages

## Usage

### Running Seed Scripts

```bash
# Install dependencies
npm install

# Seed all data
npm run seed

# Seed specific models
npm run seed:users
npm run seed:books

# Or use the full command
npm run seed specific books
```

### Importing Models

```typescript
// Import specific models
import { User, Book, ProjectItem } from '@/models';

// Import types
import type { IUser, IBook, IProjectItem } from '@/models';
```

### Environment Variables

Make sure to set your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/tamil-language-society
```

## Features

### Bilingual Support
All user-facing text fields support both English and Tamil:
```typescript
{
  title: {
    en: "English Title",
    ta: "à®¤à®®à®¿à®´à¯ à®¤à®²à¯ˆà®ªà¯à®ªà¯"
  }
}
```

### TypeScript Integration
Full TypeScript support with interfaces and document types:
```typescript
interface IUser {
  email: string;
  name: BilingualText;
  role: 'admin' | 'user';
}

interface IUserDocument extends IUser, Document {
  // Document methods
}
```

### Validation
Comprehensive validation rules:
- Required fields
- Email format validation
- Enum constraints
- Custom validators
- Unique constraints

### Virtual Fields
Computed fields for enhanced functionality:
- Full names from bilingual fields
- Formatted file sizes
- Age calculations
- Status derivations

### Static Methods
Model-level query methods:
- `getActive()` - Get active items
- `getFeatured()` - Get featured items
- `searchByText()` - Text search
- `getByCategory()` - Category filtering

### Instance Methods
Document-level operations:
- `markAsRead()` - Mark notifications as read
- `incrementDownload()` - Increment download counts
- `checkAvailability()` - Check stock/availability
- `calculateTotal()` - Calculate totals

This comprehensive model structure provides a solid foundation for the Tamil Language Society application with proper data relationships, validation, and bilingual support throughout.
