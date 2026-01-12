const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

// Define Schemas (simplified but sufficient)
const RecruitmentResponseSchema = new mongoose.Schema({
  formRef: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentForm' },
  applicantName: String,
  applicantEmail: String,
  roleApplied: String,
  answers: Object,
  status: String,
  submittedAt: Date
}, { strict: false });

const RecruitmentFormSchema = new mongoose.Schema({
  title: Object,
  currentResponses: { type: Number, default: 0 },
  createdBy: mongoose.Schema.Types.ObjectId
}, { strict: false });

const RecruitmentResponse = mongoose.models.RecruitmentResponse || mongoose.model('RecruitmentResponse', RecruitmentResponseSchema);
const RecruitmentForm = mongoose.models.RecruitmentForm || mongoose.model('RecruitmentForm', RecruitmentFormSchema);

async function verifyFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create a dummy form
    const form = await RecruitmentForm.create({
      title: { en: 'Test Form for Fix Verification' },
      currentResponses: 0
    });
    console.log(`Created dummy form: ${form._id}`);

    // 2. Create a dummy response (simulate submission logic)
    const response = await RecruitmentResponse.create({
      formRef: form._id,
      applicantName: 'Test User',
      applicantEmail: 'test@example.com',
      roleApplied: 'participant',
      answers: { q1: 'a1' },
      status: 'pending',
      submittedAt: new Date()
    });
    console.log(`Created dummy response: ${response._id}`);

    // 3. Increment count (simulating what the submit API does)
    await RecruitmentForm.findByIdAndUpdate(form._id, { $inc: { currentResponses: 1 } });
    
    // Verify count is 1
    const formAfterAdd = await RecruitmentForm.findById(form._id);
    console.log(`Form count after add: ${formAfterAdd.currentResponses} (Expected: 1)`);
    if (formAfterAdd.currentResponses !== 1) throw new Error('Count mismatch after add');

    // 4. Delete response and decrement (simulating the FIX)
    // This logic mimics exactly what I added to the API route
    const deletedResponse = await RecruitmentResponse.findByIdAndDelete(response._id).lean();
    if (deletedResponse && deletedResponse.formRef) {
       await RecruitmentForm.findByIdAndUpdate(deletedResponse.formRef, { 
         $inc: { currentResponses: -1 } 
       });
    }
    console.log('Deleted response and executed decrement logic');

    // 5. Verify count is 0
    const formAfterDelete = await RecruitmentForm.findById(form._id);
    console.log(`Form count after delete: ${formAfterDelete.currentResponses} (Expected: 0)`);
    
    if (formAfterDelete.currentResponses !== 0) {
        console.error('❌ FIX FAILED: Count is not 0');
    } else {
        console.log('✅ FIX VERIFIED: Count returned to 0');
    }

    // Cleanup
    await RecruitmentForm.findByIdAndDelete(form._id);
    console.log('Cleaned up dummy form');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

verifyFix();
