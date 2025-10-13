import dbConnect from '../src/lib/mongodb';
import ProjectItem from '../src/models/ProjectItem';
import RecruitmentForm from '../src/models/RecruitmentForm';

async function run() {
  await dbConnect();

  const anyProject = await ProjectItem.findOne({}).sort({ createdAt: -1 });
  if (!anyProject) {
    console.log('No ProjectItem found to attach recruitment form.');
    process.exit(0);
  }

  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // opens tomorrow
  const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000); // closes two days later

  const form = new RecruitmentForm({
    title: 'Crew Recruitment',
    description: 'Join our production crew. Share your experience and availability.',
    role: 'crew',
    isActive: true,
    startDate: start,
    endDate: end,
    maxResponses: 100,
    currentResponses: 0,
    fields: [
      { key: 'experience', label: 'Relevant experience', type: 'textarea', required: true },
      { key: 'availability', label: 'Availability dates', type: 'text', required: true },
      { key: 'phone', label: 'Phone number', type: 'text', required: false },
      { key: 'portfolio', label: 'Portfolio link (optional)', type: 'text', required: false },
      { key: 'motivation', label: 'Why do you want to join?', type: 'textarea', required: true },
    ],
  });

  await form.save();
  anyProject.recruitmentFormId = form._id;
  await anyProject.save();

  console.log('Seeded recruitment form and linked to project:', anyProject._id.toString());
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});