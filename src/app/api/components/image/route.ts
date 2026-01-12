import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Component from '../../../../models/Component';
import { FileHandler } from '../../../../lib/fileHandler';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get('id');
    const field = searchParams.get('field') || 'url'; // Default to 'url' for image components
    
    if (!componentId) {
      return NextResponse.json({ error: 'Component ID is required' }, { status: 400 });
    }

    // Find the component
    const component = await Component.findById(componentId);
    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Get the image path from component content
    let imagePath: string | undefined;
    
    if (component.type === 'image' && component.content?.url) {
      imagePath = component.content.url;
    } else if (component.content?.[field]) {
      imagePath = component.content[field];
    } else if (component.content?.image?.src) {
      imagePath = component.content.image.src;
    } else if (component.content?.backgroundImage) {
      imagePath = component.content.backgroundImage;
    }

    if (!imagePath) {
      return NextResponse.json({ error: 'No image found for this component' }, { status: 404 });
    }

    // Extract the file path from the URL if it's a full URL
    let filePath = imagePath;
    if (imagePath.startsWith('/api/files/serve?path=')) {
      const urlParams = new URLSearchParams(imagePath.split('?')[1]);
      filePath = urlParams.get('path') || imagePath;
    } else if (imagePath.startsWith('http')) {
      // If it's a full URL, extract the path
      try {
        const url = new URL(imagePath);
        if (url.pathname.startsWith('/api/files/serve')) {
          const urlParams = new URLSearchParams(url.search);
          filePath = urlParams.get('path') || imagePath;
        }
      } catch (e) {
        // If URL parsing fails, use the original path
      }
    }

    // Serve the file
    const fileResult = await FileHandler.getFile(filePath);
    
    if (!fileResult.success || !fileResult.buffer) {
      return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    // Set appropriate headers for caching and content type
    const headers = new Headers();
    headers.set('Content-Type', fileResult.mimeType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    headers.set('ETag', `"${componentId}-${component.updatedAt?.getTime() || Date.now()}"`);
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    const etag = headers.get('ETag');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return new NextResponse(fileResult.buffer as any, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Component image serving error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}