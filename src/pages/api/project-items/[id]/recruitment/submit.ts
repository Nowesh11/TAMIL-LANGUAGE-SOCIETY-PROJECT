import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ProjectItem from '@/models/ProjectItem';
import RecruitmentForm from '@/models/RecruitmentForm';
import RecruitmentResponse from '@/models/RecruitmentResponse';
import mongoose from 'mongoose';

function normalizeRole(role: string) {
  if (role === 'participants') return 'participant';
  return role;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await dbConnect();
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id parameter' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id format' });
    }

    const { applicantName, applicantEmail, answers, userRef } = req.body || {};
    if (!applicantName || !applicantEmail || !answers) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const project = await ProjectItem.findById(id);
    if (!project || !project.recruitmentFormId) {
      return res.status(404).json({ error: 'Recruitment unavailable' });
    }

    const form: any = await RecruitmentForm.findById(project.recruitmentFormId);
    if (!form || !form.isActive) {
      return res.status(400).json({ error: 'Form not active' });
    }

    const now = new Date();
    if (form.startDate && now < new Date(form.startDate)) {
      return res.status(400).json({ error: 'Form not yet open' });
    }
    if (form.endDate && now > new Date(form.endDate)) {
      return res.status(400).json({ error: 'Form closed' });
    }
    if (form.maxResponses && form.currentResponses >= form.maxResponses) {
      return res.status(400).json({ error: 'Form full' });
    }

    // Normalize answers into key-value map keyed by field id or key
    let normalizedAnswers: Record<string, unknown> = {};
    if (Array.isArray(answers)) {
      normalizedAnswers = (answers as Array<{ key?: string; id?: string; value: unknown }>).
        reduce((acc, a) => {
          const k = (a?.key || a?.id || '').toString();
          if (k) acc[k] = a.value;
          return acc;
        }, {} as Record<string, unknown>);
    } else if (typeof answers === 'object' && answers !== null) {
      normalizedAnswers = answers as Record<string, unknown>;
    } else {
      return res.status(400).json({ error: 'Answers must be an object or array' });
    }

    // Ensure required fields exist
    const requiredFields: string[] = Array.isArray((form as any)?.fields)
      ? ((form as any).fields.filter((f: any) => f?.required).map((f: any) => f?.id)).filter(Boolean)
      : [];
    for (const rf of requiredFields) {
      const v = normalizedAnswers[rf];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        return res.status(400).json({ error: `Required field '${rf}' is missing` });
      }
    }
    const response = new RecruitmentResponse({
      formRef: form._id,
      projectItemRef: project._id,
      roleApplied: normalizeRole(form.role),
      answers: normalizedAnswers,
      applicantEmail,
      applicantName,
      userRef: userRef || null,
      status: 'submitted',
      submittedAt: new Date(),
    });
    await response.save();

    await RecruitmentForm.findByIdAndUpdate(form._id, { $inc: { currentResponses: 1 } });

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to submit recruitment response';
    return res.status(500).json({ error });
  }
}
