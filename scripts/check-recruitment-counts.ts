
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

// Schemas
const RecruitmentFormSchema = new mongoose.Schema({
  title: { en: String, ta: String },
  currentResponses: Number
}, { collection: 'recruitmentforms' });

const RecruitmentResponseSchema = new mongoose.Schema({
  formRef: mongoose.Schema.Types.ObjectId,
  applicantName: String,
  status: String
}, { collection: 'recruitmentresponses' });

const RecruitmentForm = mongoose.models.RecruitmentForm || mongoose.model('RecruitmentForm', RecruitmentFormSchema);
const RecruitmentResponse = mongoose.models.RecruitmentResponse || mongoose.model('RecruitmentResponse', RecruitmentResponseSchema);

async function checkCounts() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const forms = await RecruitmentForm.find({}).lean();
    console.log(`Found ${forms.length} forms.`);

    for (const form of forms) {
      const formId = form._id;
      const storedCount = form.currentResponses;
      
      const realCount = await RecruitmentResponse.countDocuments({ formRef: formId });
      
      console.log(`Form: ${form.title?.en} (ID: ${formId})`);
      console.log(`  - Stored Count: ${storedCount}`);
      console.log(`  - Real Count (ObjectId): ${realCount}`);
      
      if (storedCount !== realCount) {
        console.warn(`  MISMATCH DETECTED!`);
      }

      // Check for potential string mismatches
      const stringCount = await RecruitmentResponse.countDocuments({ formRef: String(formId) });
      if (stringCount !== realCount) {
        console.log(`  - Count by String ID: ${stringCount}`);
      }
    }

    const allResponses = await RecruitmentResponse.find({}, 'formRef').lean();
    console.log(`\nTotal Responses in DB: ${allResponses.length}`);
    
    // Check for orphaned responses
    const formIds = new Set(forms.map(f => String(f._id)));
    let orphaned = 0;
    for (const r of allResponses) {
      if (!formIds.has(String(r.formRef))) {
        orphaned++;
      }
    }
    console.log(`Orphaned Responses (invalid formRef): ${orphaned}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

checkCounts();
