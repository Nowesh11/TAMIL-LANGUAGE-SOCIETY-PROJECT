import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import PaymentSettings from '../src/models/PaymentSettings';

async function connectDB() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
}

async function seedPaymentSettings() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if payment settings already exist
    const existingSettings = await PaymentSettings.findOne();
    if (existingSettings) {
      console.log('Payment settings already exist. Skipping seed.');
      return;
    }

    // Create default payment settings
    const paymentSettings = new PaymentSettings({
      epayum: {
        link: 'https://epayum.com/payment/tamil-language-society',
        instructions: 'Click the link above to complete your payment via E-PAY UM. After payment, please upload your receipt for verification.',
        isActive: true
      },
      fpx: {
        bankName: 'Maybank',
        accountNumber: '1234567890123',
        accountHolder: 'Tamil Language Society',
        instructions: 'Please transfer the amount to the bank account above. Include your order ID in the transfer reference and upload your receipt for verification.',
        isActive: true
      },
      shipping: {
        fee: 15.00,
        currency: 'MYR',
        freeShippingThreshold: 100.00,
        estimatedDays: 7,
        availableCountries: ['Malaysia', 'Singapore', 'Thailand', 'Indonesia']
      },
      taxRate: 6, // 6% GST
      currency: 'MYR',
      isMaintenanceMode: false,
      maintenanceMessage: 'The payment system is currently under maintenance. Please try again later.',
      supportEmail: 'support@tamillanguagesociety.org',
      supportPhone: '+60123456789',
      termsAndConditions: `
Terms and Conditions

1. Payment Processing
- All payments are processed securely through our authorized payment partners
- Payment confirmation may take 1-3 business days for bank transfers
- E-PAY UM payments are processed instantly

2. Shipping and Delivery
- Standard shipping takes 5-10 business days within Malaysia
- International shipping may take 2-4 weeks
- Free shipping available for orders above RM 100

3. Returns and Refunds
- Items can be returned within 14 days of delivery
- Items must be in original condition
- Refunds will be processed within 7-14 business days

4. Digital Products
- E-books are delivered instantly via email
- No refunds for digital products after download

5. Contact Information
- For support, contact us at support@tamillanguagesociety.org
- Phone: +60123456789

By making a purchase, you agree to these terms and conditions.
      `.trim(),
      privacyPolicy: `
Privacy Policy

1. Information Collection
- We collect information necessary to process your orders
- Personal information includes name, email, address, and phone number
- Payment information is processed securely by our payment partners

2. Information Use
- Personal information is used to process and fulfill orders
- Email addresses may be used for order updates and newsletters
- We do not sell or share personal information with third parties

3. Data Security
- All personal information is encrypted and stored securely
- Payment information is processed through secure, PCI-compliant systems
- We implement industry-standard security measures

4. Cookies and Tracking
- We use cookies to improve user experience
- Analytics data helps us improve our services
- You can disable cookies in your browser settings

5. Contact Information
- For privacy concerns, contact us at privacy@tamillanguagesociety.org
- You can request data deletion or modification at any time

This privacy policy is effective as of the date of your first purchase.
      `.trim(),
      refundPolicy: `
Refund Policy

1. Eligibility
- Physical products: 14 days from delivery date
- Items must be unused and in original packaging
- Digital products: No refunds after download

2. Process
- Contact support@tamillanguagesociety.org to initiate return
- Provide order number and reason for return
- Return shipping costs are customer's responsibility

3. Refund Timeline
- Refunds processed within 7-14 business days
- Original payment method will be credited
- Shipping fees are non-refundable

4. Exceptions
- Damaged items will be replaced or refunded
- Wrong items shipped will be exchanged at no cost
- Custom or personalized items cannot be returned

5. Contact
- Email: support@tamillanguagesociety.org
- Phone: +60123456789

We strive to ensure customer satisfaction with all purchases.
      `.trim()
    });

    await paymentSettings.save();
    console.log('✅ Payment settings seeded successfully');

    // Display the created settings
    console.log('\n📋 Created Payment Settings:');
    console.log(`- Currency: ${paymentSettings.currency}`);
    console.log(`- Tax Rate: ${paymentSettings.taxRate}%`);
    console.log(`- Shipping Fee: ${paymentSettings.shipping.currency} ${paymentSettings.shipping.fee}`);
    console.log(`- Free Shipping Threshold: ${paymentSettings.shipping.currency} ${paymentSettings.shipping.freeShippingThreshold}`);
    console.log(`- E-PAY UM Active: ${paymentSettings.epayum.isActive}`);
    console.log(`- FPX Active: ${paymentSettings.fpx.isActive}`);
    console.log(`- Available Countries: ${paymentSettings.shipping.availableCountries.join(', ')}`);
    console.log(`- Support Email: ${paymentSettings.supportEmail}`);
    console.log(`- Support Phone: ${paymentSettings.supportPhone}`);

  } catch (error) {
    console.error('❌ Error seeding payment settings:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedPaymentSettings();
}

export default seedPaymentSettings;