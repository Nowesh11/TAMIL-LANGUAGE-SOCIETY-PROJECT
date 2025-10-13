import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Team from '../../../models/Team';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const department = searchParams.get('department') || undefined;
    const sort = searchParams.get('sort') || 'hierarchy';

    let query = Team.find({ isActive: true });
    
    if (role) {
      query = query.where('role', role);
    }
    if (department) {
      query = query.where('department', department);
    }
    
    // Apply sorting
    if (sort === 'hierarchy') {
      query = query.sort({ orderNum: 1, name: 1 });
    } else {
      query = query.sort({ name: 1 });
    }
    
    const members = await query.lean();
    const result = members.map((m) => ({
      _id: String(m._id),
      name: m.name,
      role: m.role,
      slug: m.slug,
      bio: m.bio,
      email: m.email,
      phone: m.phone,
      orderNum: m.orderNum,
      isActive: m.isActive,
      department: m.department,
      joinedDate: m.joinedDate,
      achievements: m.achievements || [],
      specializations: m.specializations || [],
      languages: m.languages || [],
      socialLinks: m.socialLinks || {},
      imageUrl: m.imagePath ? `/api/team/image?id=${m._id}` : null,
    }));

    return NextResponse.json({ members: result });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch team';
    return NextResponse.json({ error }, { status: 500 });
  }
}