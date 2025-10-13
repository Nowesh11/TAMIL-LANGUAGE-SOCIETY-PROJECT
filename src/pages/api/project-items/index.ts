import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import ProjectItem from '@/models/ProjectItem';

function bureauLabelToEnum(label: string | null): string | undefined {
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  switch (normalized) {
    case 'sports & leadership bureau':
    case 'sports_leadership':
      return 'sports_leadership';
    case 'education & intellectual bureau':
    case 'education_intellectual':
      return 'education_intellectual';
    case 'arts & culture bureau':
    case 'arts_culture':
      return 'arts_culture';
    case 'social welfare & voluntary bureau':
    case 'social_welfare_voluntary':
      return 'social_welfare_voluntary';
    case 'language & literature bureau':
    case 'language_literature':
      return 'language_literature';
    default:
      return undefined;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await dbConnect();
    const type = (String(req.query.type || '')).toLowerCase();
    const bureauLabel = (req.query.bureau as string) || null;
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : (req.query.limit as string | undefined);
    const limit = Math.min(parseInt(limitParam || '24', 10) || 24, 50);

    if (!type || !['project', 'activity', 'initiative'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type parameter' });
    }

    const bureau = bureauLabelToEnum(bureauLabel);
    const query: Record<string, unknown> = { type, active: true };
    if (bureau) query.bureau = bureau;

    const items = await ProjectItem.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const now = new Date();
    const result = items.map((doc: any) => {
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

      return {
        _id: String(doc._id),
        type: doc.type,
        bureau: doc.bureau,
        title: doc.title,
        shortDesc: doc.shortDesc,
        status: doc.status,
        progress,
        progressPercent,
        directorName: doc.directorName,
        featured: !!doc.featured,
        images: Array.isArray(doc.images) ? doc.images : [],
        heroImagePath: doc.heroImagePath || (Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : undefined),
      };
    });

    return res.status(200).json({ items: result });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch project items';
    return res.status(500).json({ error });
  }
}