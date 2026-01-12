import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interfaces
export interface IShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface IPaymentDetails {
  method: 'epayum' | 'fpx' | 'cash' | 'card';
  transactionId?: string;
  receiptPath?: string; // Path to uploaded receipt/slip
  amount: number;
  currency: string;
  paidAt?: Date;
  notes?: string;
}

export interface IPurchase extends Document {
  _id: Types.ObjectId;
  userRef: Types.ObjectId;
  bookRef: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentDetails: IPaymentDetails;
  shippingAddress: IShippingAddress;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  notes?: string;
  refundReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  calculateTotal(): this;
}

// Shipping Address schema
const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot exceed 200 characters']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters'],
    default: 'Malaysia'
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        // Allow Malaysian phone numbers (01x-xxxxxxx, +60x-xxxxxxx) and international formats
        return /^(\+?6?0?1[0-9]{8,9}|[\+]?[1-9][\d]{7,15})$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  }
}, { _id: false });

// Payment Details schema
const PaymentDetailsSchema = new Schema<IPaymentDetails>({
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['epayum', 'fpx', 'cash', 'card'],
      message: 'Payment method must be epayum, fpx, cash, or card'
    }
  },
  transactionId: {
    type: String,
    trim: true,
    maxlength: [100, 'Transaction ID cannot exceed 100 characters']
  },
  receiptPath: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\/.*\.(jpg|jpeg|png|pdf)$/i.test(v);
      },
      message: 'Receipt path must be a valid file path with jpg, jpeg, png, or pdf extension'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount must be non-negative'],
    validate: {
      validator: function(v: number) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Payment amount must be a valid positive number'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
    uppercase: true,
    default: 'RM',
    validate: {
      validator: function(v: string) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Currency must be a valid 3-letter currency code'
    }
  },
  paidAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment notes cannot exceed 500 characters']
  }
}, { _id: false });

// Purchase schema definition
const PurchaseSchema = new Schema<IPurchase>({
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  bookRef: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: (v: number) => Number.isInteger(v) && v >= 1,
      message: 'Quantity must be a positive integer'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be non-negative'],
    validate: {
      validator: (v: number) => Number.isFinite(v) && v >= 0,
      message: 'Unit price must be a valid positive number'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount must be non-negative']
  },
  shippingFee: {
    type: Number,
    required: [true, 'Shipping fee is required'],
    min: [0, 'Shipping fee must be non-negative'],
    default: 0
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount must be non-negative']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      message: 'Status must be pending, paid, processing, shipped, delivered, cancelled, or refunded'
    },
    default: 'pending'
  },
  paymentDetails: {
    type: PaymentDetailsSchema,
    required: [true, 'Payment details are required']
  },
  shippingAddress: {
    type: ShippingAddressSchema,
    required: [true, 'Shipping address is required']
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Tracking number cannot exceed 100 characters']
  },
  estimatedDelivery: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v > new Date();
      },
      message: 'Estimated delivery date must be in the future'
    }
  },
  deliveredAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Refund reason cannot exceed 500 characters']
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount must be non-negative'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Refund amount must be a valid positive number'
    }
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
PurchaseSchema.index({ userRef: 1, createdAt: -1 });
PurchaseSchema.index({ bookRef: 1 });
PurchaseSchema.index({ status: 1, createdAt: -1 });
PurchaseSchema.index({ 'paymentDetails.method': 1 });
PurchaseSchema.index({ trackingNumber: 1 });
PurchaseSchema.index({ deliveredAt: -1 });
PurchaseSchema.index({ finalAmount: -1 });

// Compound indexes
PurchaseSchema.index({ userRef: 1, status: 1 });
PurchaseSchema.index({ status: 1, estimatedDelivery: 1 });

// Virtual to populate user information
PurchaseSchema.virtual('user', {
  ref: 'User',
  localField: 'userRef',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate book information
PurchaseSchema.virtual('book', {
  ref: 'Book',
  localField: 'bookRef',
  foreignField: '_id',
  justOne: true
});

// Virtual for order age in days
PurchaseSchema.virtual('orderAge').get(function(this: IPurchase) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
PurchaseSchema.virtual('deliveryStatus').get(function(this: IPurchase) {
  if (this.deliveredAt) return 'delivered';
  if (this.status === 'shipped' && this.estimatedDelivery) {
    return new Date() > this.estimatedDelivery ? 'overdue' : 'in_transit';
  }
  return this.status;
});

// Virtual for formatted shipping address
PurchaseSchema.virtual('formattedAddress').get(function(this: IPurchase) {
  const addr = this.shippingAddress;
  let formatted = `${addr.fullName}\n${addr.addressLine1}`;
  if (addr.addressLine2) formatted += `\n${addr.addressLine2}`;
  formatted += `\n${addr.city}, ${addr.state} ${addr.postalCode}`;
  formatted += `\n${addr.country}`;
  if (addr.phone) formatted += `\nPhone: ${addr.phone}`;
  return formatted;
});

// Static method to get purchases by user
PurchaseSchema.statics.getByUser = function(userId: Types.ObjectId, status?: string) {
  const query: Record<string, unknown> = { userRef: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('bookRef', 'title author coverPath price')
    .populate('userRef', 'name email');
};

// Static method to get purchases by status
PurchaseSchema.statics.getByStatus = function(status: string, limit?: number) {
  const query = this.find({ status })
    .sort({ createdAt: -1 })
    .populate('bookRef', 'title author coverPath price')
    .populate('userRef', 'name email');
  
  if (limit) query.limit(limit);
  return query;
};

// Static method to get pending payments
PurchaseSchema.statics.getPendingPayments = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .populate('bookRef', 'title author price')
    .populate('userRef', 'name email');
};

// Static method to get overdue deliveries
PurchaseSchema.statics.getOverdueDeliveries = function() {
  return this.find({
    status: 'shipped',
    estimatedDelivery: { $lt: new Date() },
    deliveredAt: { $exists: false }
  })
    .sort({ estimatedDelivery: 1 })
    .populate('bookRef', 'title author')
    .populate('userRef', 'name email');
};

// Static method to get sales statistics
PurchaseSchema.statics.getSalesStats = function(startDate?: Date, endDate?: Date) {
  const matchStage: Record<string, unknown> = { status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } };
  
  if (startDate || endDate) {
    const createdAtQuery: Record<string, Date> = {};
    if (startDate) createdAtQuery.$gte = startDate;
    if (endDate) createdAtQuery.$lte = endDate;
    matchStage.createdAt = createdAtQuery;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$finalAmount' },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        averageOrderValue: { $avg: '$finalAmount' }
      }
    }
  ]);
};

// Instance method to calculate total amount
PurchaseSchema.methods.calculateTotal = function() {
  this.totalAmount = this.unitPrice * this.quantity;
  this.finalAmount = this.totalAmount + this.shippingFee;
  return this;
};

// Instance method to mark as paid
PurchaseSchema.methods.markAsPaid = function(transactionId?: string, paidAt?: Date) {
  this.status = 'paid';
  this.paymentDetails.paidAt = paidAt || new Date();
  if (transactionId) {
    this.paymentDetails.transactionId = transactionId;
  }
  return this.save();
};

// Instance method to update shipping status
PurchaseSchema.methods.updateShippingStatus = function(status: string, trackingNumber?: string, estimatedDelivery?: Date) {
  this.status = status as IPurchase['status'];
  if (trackingNumber) this.trackingNumber = trackingNumber;
  if (estimatedDelivery) this.estimatedDelivery = estimatedDelivery;
  
  if (status === 'delivered') {
    this.deliveredAt = new Date();
  }
  
  return this.save();
};

// Instance method to process refund
PurchaseSchema.methods.processRefund = function(reason: string, amount?: number) {
  this.status = 'refunded';
  this.refundReason = reason;
  this.refundAmount = amount || this.finalAmount;
  this.refundedAt = new Date();
  return this.save();
};

// Pre-save middleware to calculate totals
PurchaseSchema.pre('save', function(next) {
  if (this.isModified('unitPrice') || this.isModified('quantity') || this.isModified('shippingFee')) {
    this.calculateTotal();
  }
  next();
});

// Pre-save middleware to validate delivery date
PurchaseSchema.pre('save', function(next) {
  if (this.deliveredAt && this.deliveredAt < this.createdAt) {
    return next(new Error('Delivery date cannot be before order date'));
  }
  next();
});

// Pre-save middleware to validate refund amount
PurchaseSchema.pre('save', function(next) {
  if (this.refundAmount && this.refundAmount > this.finalAmount) {
    return next(new Error('Refund amount cannot exceed final amount'));
  }
  next();
});

// Export the model
const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
export default Purchase;