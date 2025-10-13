import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ProjectItem from '@/models/ProjectItem';
import RecruitmentForm from '@/models/RecruitmentForm';
import mongoose from 'mongoose';

type LeanProject = {
  _id: mongoose.Types.ObjectId;
  recruitmentFormId?: string | mongoose.Types.ObjectId;
};

function normalizeRole(role: string) {
  if (role === 'participants') return 'participant';
  return role;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await dbConnect();
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing id parameter' });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid id format' });
      }

      const project = (await ProjectItem.findById(id).lean()) as LeanProject | null;
      if (!project) return res.status(404).json({ error: 'Not found' });

      if (!project.recruitmentFormId) {
        return res.status(200).json({ form: null, status: 'inactive' });
      }

      const form: any = await RecruitmentForm.findById(project.recruitmentFormId).lean();
      if (!form) return res.status(200).json({ form: null, status: 'inactive' });

      const now = new Date();
      let status: 'inactive' | 'upcoming' | 'expired' | 'open' | 'full' = 'open';
      if (!form.isActive) status = 'inactive';
      else if (form.maxResponses && form.currentResponses >= form.maxResponses) status = 'full';
      else if (form.endDate && now > new Date(form.endDate)) status = 'expired';
      else if (form.startDate && now < new Date(form.startDate)) status = 'upcoming';

      const result = {
        _id: String(form._id),
        title: form.title,
        description: form.description,
        role: normalizeRole(form.role),
        isActive: form.isActive,
        startDate: form.startDate,
        endDate: form.endDate,
        maxResponses: form.maxResponses,
        currentResponses: form.currentResponses,
        fields: form.fields,
        status,
      };

      return res.status(200).json({ form: result });
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to fetch recruitment form';
      return res.status(500).json({ error });
    }
  }

  if (req.method === 'POST') {
    try {
      await dbConnect();
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing id parameter' });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid id format' });
      }

      const project = (await ProjectItem.findById(id).lean()) as LeanProject | null;
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const {
        title,
        description,
        role,
        fields,
        startDate,
        endDate,
        isActive = true,
        maxResponses,
        emailNotification = true,
      } = req.body || {};

      if (!title || !title.en || !title.ta) {
        return res.status(400).json({ error: 'Bilingual title is required' });
      }
      if (!role || !['crew', 'participants', 'volunteer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be crew, participants, or volunteer' });
      }
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ error: 'At least one form field is required' });
      }

      const adminUser = await (await import('@/models/User')).default.findOne({ role: 'admin' });
      if (!adminUser) {
        return res.status(400).json({ error: 'Admin user not found. Seed users first.' });
      }

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (!start || !end) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
      if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'startDate and endDate must be valid dates' });
      }
      if (end <= start) {
        return res.status(400).json({ error: 'endDate must be after startDate' });
      }

      const existing = await RecruitmentForm.find({ projectItemId: id }).select('startDate endDate title isActive');
      const newStart = start;
      const newEnd = end;
      const clashes = existing.filter((f: any) => {
        const s: Date = f.startDate ? new Date(f.startDate) : new Date(0);
        const e: Date = f.endDate ? new Date(f.endDate) : new Date(8640000000000000);
        return newStart < e && s < newEnd;
      });

      if (clashes.length > 0) {
        return res.status(409).json({
          error: 'Date range overlaps with existing form(s) for this project',
          overlaps: clashes.map(c => ({ title: c?.title, startDate: c?.startDate, endDate: c?.endDate }))
        });
      }

      const form = await RecruitmentForm.create({
        title,
        description,
        role,
        fields,
        isActive,
        startDate: newStart,
        endDate: newEnd,
        maxResponses,
        emailNotification,
        createdBy: adminUser._id,
        projectItemId: project._id,
      });

      const result = {
        _id: String(form._id),
        title: form.title,
        description: form.description,
        role: normalizeRole(form.role),
        isActive: form.isActive,
        startDate: form.startDate,
        endDate: form.endDate,
        maxResponses: form.maxResponses,
        currentResponses: form.currentResponses,
        fields: form.fields,
        status: form.status,
        projectItemId: String(project._id),
      };

      return res.status(201).json({ form: result });
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to create recruitment form';
      return res.status(500).json({ error });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}