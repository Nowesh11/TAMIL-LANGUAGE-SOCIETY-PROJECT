import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withAuth } from '@/lib/auth';

export const GET = withAuth({ role: 'admin' })(async function (req: NextRequest) {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    const getAllFiles = (dir: string, fileList: any[] = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          fileList.push({
            name: file,
            path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
            size: stat.size,
            created: stat.birthtime,
            type: path.extname(file).toLowerCase()
          });
        }
      });
      return fileList;
    };

    const files = getAllFiles(uploadsDir);
    // Sort by newest first
    files.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({ success: true, files });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to list files' }, { status: 500 });
  }
});