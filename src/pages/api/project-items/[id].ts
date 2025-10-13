import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ProjectItem from '@/models/ProjectItem';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
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

    const doc: any = await ProjectItem.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Not found' });
    }

    const now = new Date();
    let progress: string = 'in-progress';
    if (!doc.startDate) progress = 'not-started';
    if (doc.status === 'completed') progress = 'completed';
    else if (doc.status === 'cancelled') progress = 'cancelled';
    else if (doc.status === 'on-hold') progress = 'on-hold';
    else if (doc.startDate && now < new Date(doc.startDate)) progress = 'upcoming';
    else if (doc.endDate && now > new Date(doc.endDate)) progress = 'overdue';

    let progressPercent = 0;
    const start = doc.startDate ? new Date(doc.startDate) : null;
    const end = doc.endDate ? new Date(doc.endDate) : null;
    if (doc.status === 'completed') {
      progressPercent = 100;
    } else if (start && end && end > start) {
      const total = end.getTime() - start.getTime();
      const elapsed = Math.max(0, now.getTime() - start.getTime());
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    } else if (doc.status === 'planning' || progress === 'not-started' || progress === 'upcoming') {
      progressPercent = 0;
    } else if (progress === 'overdue') {
      progressPercent = 100;
    } else if (doc.status === 'on-hold') {
      progressPercent = 25;
    } else if (doc.status === 'active') {
      progressPercent = 50;
    }

    const item = {
      _id: String(doc._id),
      type: doc.type,
      bureau: doc.bureau,
      title: doc.title,
      shortDesc: doc.shortDesc,
      fullDesc: doc.fullDesc,
      goals: doc.goals,
      achievement: doc.achievement,
      directorName: doc.directorName,
      location: doc.location,
      status: doc.status,
      startDate: doc.startDate,
      endDate: doc.endDate,
      budget: doc.budget,
      participants: doc.participants,
      featured: !!doc.featured,
      images: Array.isArray(doc.images) ? doc.images : [],
      heroImagePath: doc.heroImagePath || (Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : undefined),
      progress,
      progressPercent,
    };

    return res.status(200).json({ item });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch item';
    return res.status(500).json({ error });
  }
}