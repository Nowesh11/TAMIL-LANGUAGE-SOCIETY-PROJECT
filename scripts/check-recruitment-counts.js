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

// Define Schemas (simplified)
const RecruitmentResponseSchema = new mongoose.Schema({
  formRef: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentForm' },
  // ... other fields
}, { strict: false });

const RecruitmentFormSchema = new mongoose.Schema({
  title: Object,
  currentResponses: Number
}, { strict: false });

const RecruitmentResponse = mongoose.models.RecruitmentResponse || mongoose.model('RecruitmentResponse', RecruitmentResponseSchema);
const RecruitmentForm = mongoose.models.RecruitmentForm || mongoose.model('RecruitmentForm', RecruitmentFormSchema);

async function checkCounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const forms = await RecruitmentForm.find({}).lean();
    console.log(`Found ${forms.length} forms.`);

    for (const form of forms) {
      const formTitle = form.title?.en || form.title?.ta || 'Untitled';
      const storedCount = form.currentResponses;
      
      // Simulate API logic exactly
      const actualCount = await RecruitmentResponse.countDocuments({ formRef: form._id });

      console.log(`Form: ${formTitle} (ID: ${form._id})`);
      console.log(`  Stored Count (in Form): ${storedCount}`);
      console.log(`  Actual Count (in Responses): ${actualCount}`);
      
      if (actualCount === 0 && storedCount > 0) {
          console.log(`  ⚠️  API would return 0 but Stored is ${storedCount} (Reverse mismatch?)`);
      }

      
      // Also check if there are responses with this formId stored as string or something else
      const stringIdCount = await RecruitmentResponse.countDocuments({ formRef: form._id.toString() });
       if (stringIdCount !== actualCount) {
           console.log(`  ⚠️  String ID Count different: ${stringIdCount}`);
       }
       
       // Check for field name mismatch (e.g. formId vs formRef)
       const formIdCount = await RecruitmentResponse.countDocuments({ formId: form._id });
       if (formIdCount > 0) {
           console.log(`  ⚠️  Found ${formIdCount} responses using 'formId' instead of 'formRef'`);
       }
    }
    
    // Check for orphaned responses
    const allResponses = await RecruitmentResponse.find({}, 'formRef formId');
    console.log(`\nTotal Responses: ${allResponses.length}`);
    
    const formIds = forms.map(f => f._id.toString());
    let orphaned = 0;
    
    for (const resp of allResponses) {
        const ref = resp.formRef ? resp.formRef.toString() : null;
        const id = resp.formId ? resp.formId.toString() : null;
        
        if (ref && !formIds.includes(ref)) {
            console.log(`Orphaned Response (formRef): ${resp._id} -> ${ref}`);
            orphaned++;
        }
        if (id && !formIds.includes(id)) {
            console.log(`Orphaned Response (formId): ${resp._id} -> ${id}`);
        }
    }
    
    if (orphaned === 0) console.log('No orphaned responses found based on formRef.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

checkCounts();
