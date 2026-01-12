import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interfaces
export interface IEpayumSettings {
  link: string;
  instructions: string;
  isActive: boolean;
}

export interface IFpxSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  image?: string; // QR code image path
  isActive: boolean;
}

export interface IShippingSettings {
  fee: number;
  currency: string;
  freeShippingThreshold?: number;
  estimatedDays: number;
  availableCountries: string[];
}

export interface IStripeSettings {
  publishableKey?: string;
  secretKey?: string;
  isActive: boolean;
}

export interface IPaymentSettings extends Document {
  _id: Types.ObjectId;
  epayum: IEpayumSettings;
  fpx: IFpxSettings;
  stripe: IStripeSettings;
  shipping: IShippingSettings;
  taxRate: number; // Percentage (e.g., 6 for 6% GST)
  currency: string;
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  supportEmail: string;
  supportPhone?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Epayum Settings schema
const EpayumSettingsSchema = new Schema<IEpayumSettings>({
  link: {
    type: String,
    required: [true, 'Epayum link is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Epayum link must be a valid URL'
    }
  },
  instructions: {
    type: String,
    required: [true, 'Epayum instructions are required'],
    trim: true,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// FPX Settings schema
const FpxSettingsSchema = new Schema<IFpxSettings>({
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9\-]+$/.test(v);
      },
      message: 'Account number must contain only numbers and hyphens'
    }
  },
  accountHolder: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true,
    maxlength: [100, 'Account holder name cannot exceed 100 characters']
  },
  instructions: {
    type: String,
    required: [true, 'FPX instructions are required'],
    trim: true,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Stripe Settings schema
const StripeSettingsSchema = new Schema<IStripeSettings>({
  publishableKey: { type: String, trim: true },
  secretKey: { type: String, trim: true },
  isActive: { type: Boolean, default: false }
}, { _id: false });

// Shipping Settings schema
const ShippingSettingsSchema = new Schema<IShippingSettings>({
  fee: {
    type: Number,
    required: [true, 'Shipping fee is required'],
    min: [0, 'Shipping fee must be non-negative'],
    validate: {
      validator: function(v: number) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Shipping fee must be a valid positive number'
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
  freeShippingThreshold: {
    type: Number,
    min: [0, 'Free shipping threshold must be non-negative'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Free shipping threshold must be a valid positive number'
    }
  },
  estimatedDays: {
    type: Number,
    required: [true, 'Estimated delivery days is required'],
    min: [1, 'Estimated delivery days must be at least 1'],
    max: [365, 'Estimated delivery days cannot exceed 365'],
    default: 7
  },
  availableCountries: [{
    type: String,
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  }]
}, { _id: false });

// Payment Settings schema definition
const PaymentSettingsSchema = new Schema<IPaymentSettings>({
  epayum: {
    type: EpayumSettingsSchema,
    required: [true, 'Epayum settings are required']
  },
  fpx: {
    type: FpxSettingsSchema,
    required: [true, 'FPX settings are required']
  },
  stripe: {
    type: StripeSettingsSchema,
    default: { isActive: false }
  },
  shipping: {
    type: ShippingSettingsSchema,
    required: [true, 'Shipping settings are required']
  },
  taxRate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate must be non-negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
    default: 0,
    validate: {
      validator: function(v: number) {
        return Number.isFinite(v) && v >= 0 && v <= 100;
      },
      message: 'Tax rate must be a valid percentage between 0 and 100'
    }
  },
  currency: {
    type: String,
    required: [true, 'Default currency is required'],
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
  isMaintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Maintenance message cannot exceed 500 characters']
  },
  supportEmail: {
    type: String,
    required: [true, 'Support email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  supportPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [10000, 'Terms and conditions cannot exceed 10000 characters']
  },
  privacyPolicy: {
    type: String,
    trim: true,
    maxlength: [10000, 'Privacy policy cannot exceed 10000 characters']
  },
  refundPolicy: {
    type: String,
    trim: true,
    maxlength: [5000, 'Refund policy cannot exceed 5000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
PaymentSettingsSchema.index({ isMaintenanceMode: 1 });
PaymentSettingsSchema.index({ 'epayum.isActive': 1 });
PaymentSettingsSchema.index({ 'fpx.isActive': 1 });
PaymentSettingsSchema.index({ currency: 1 });

// Virtual for active payment methods
PaymentSettingsSchema.virtual('activePaymentMethods').get(function() {
  const methods = [];
  if (this.epayum.isActive) methods.push('epayum');
  if (this.fpx.isActive) methods.push('fpx');
  if (this.stripe?.isActive) methods.push('stripe');
  return methods;
});

// Virtual for formatted tax rate
PaymentSettingsSchema.virtual('formattedTaxRate').get(function() {
  return `${this.taxRate}%`;
});

// Virtual for formatted shipping fee
PaymentSettingsSchema.virtual('formattedShippingFee').get(function() {
  return `${this.shipping.currency} ${this.shipping.fee.toFixed(2)}`;
});

// Virtual for free shipping status
PaymentSettingsSchema.virtual('hasFreeShipping').get(function() {
  return this.shipping.freeShippingThreshold && this.shipping.freeShippingThreshold > 0;
});

// Static method to get current settings (singleton pattern)
PaymentSettingsSchema.statics.getCurrentSettings = function() {
  return this.findOne().sort({ createdAt: -1 });
};

// Static method to get active payment methods
PaymentSettingsSchema.statics.getActivePaymentMethods = function() {
  return this.findOne()
    .select('epayum.isActive fpx.isActive stripe.isActive')
    .then((settings: IPaymentSettings | null) => {
      if (!settings) return [];
      const methods = [];
      if (settings.epayum.isActive) methods.push('epayum');
      if (settings.fpx.isActive) methods.push('fpx');
      if (settings.stripe?.isActive) methods.push('stripe');
      return methods;
    });
};

// Static method to check if maintenance mode is active
PaymentSettingsSchema.statics.isMaintenanceMode = function() {
  return this.findOne()
    .select('isMaintenanceMode maintenanceMessage')
    .then((settings: IPaymentSettings | null) => {
      return settings ? {
        isActive: settings.isMaintenanceMode,
        message: settings.maintenanceMessage
      } : { isActive: false, message: null };
    });
};

// Instance method to calculate shipping fee
PaymentSettingsSchema.methods.calculateShippingFee = function(orderTotal: number) {
  if (this.shipping.freeShippingThreshold && orderTotal >= this.shipping.freeShippingThreshold) {
    return 0;
  }
  return this.shipping.fee;
};

// Instance method to calculate tax
PaymentSettingsSchema.methods.calculateTax = function(amount: number) {
  return (amount * this.taxRate) / 100;
};

// Instance method to calculate total with tax and shipping
PaymentSettingsSchema.methods.calculateTotal = function(subtotal: number, includeShipping: boolean = true) {
  const tax = this.calculateTax(subtotal);
  const shipping = includeShipping ? this.calculateShippingFee(subtotal) : 0;
  return subtotal + tax + shipping;
};

// Instance method to toggle maintenance mode
PaymentSettingsSchema.methods.toggleMaintenanceMode = function(message?: string) {
  this.isMaintenanceMode = !this.isMaintenanceMode;
  if (this.isMaintenanceMode && message) {
    this.maintenanceMessage = message;
  } else if (!this.isMaintenanceMode) {
    this.maintenanceMessage = undefined;
  }
  return this.save();
};

// Instance method to update payment method status
PaymentSettingsSchema.methods.updatePaymentMethodStatus = function(method: 'epayum' | 'fpx', isActive: boolean) {
  if (method === 'epayum') {
    this.epayum.isActive = isActive;
  } else if (method === 'fpx') {
    this.fpx.isActive = isActive;
  }
  return this.save();
};

// Pre-save middleware to ensure at least one payment method is active
PaymentSettingsSchema.pre('save', function(next) {
  if (!this.epayum.isActive && !this.fpx.isActive && !this.stripe?.isActive) {
    return next(new Error('At least one payment method must be active'));
  }
  next();
});

// Pre-save middleware to validate maintenance mode
PaymentSettingsSchema.pre('save', function(next) {
  if (this.isMaintenanceMode && !this.maintenanceMessage) {
    this.maintenanceMessage = 'The payment system is currently under maintenance. Please try again later.';
  }
  next();
});

// Pre-save middleware to ensure default values for shipping countries
PaymentSettingsSchema.pre('save', function(next) {
  if (!this.shipping.availableCountries || this.shipping.availableCountries.length === 0) {
    this.shipping.availableCountries = ['Malaysia'];
  }
  next();
});

// Export the model
const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
export default PaymentSettings;