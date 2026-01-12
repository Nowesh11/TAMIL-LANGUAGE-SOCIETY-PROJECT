import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '@/lib/fileHandler';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const componentId = formData.get('componentId') as string;
    const componentType = formData.get('componentType') as string;
    const mediaType = formData.get('mediaType') as string; // 'image' | 'video' | 'document'
    const fieldName = formData.get('fieldName') as string; // e.g., 'backgroundImage', 'heroImage', 'galleryImage'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!componentType) {
      return NextResponse.json({ error: 'Component type is required' }, { status: 400 });
    }

    if (!mediaType) {
      return NextResponse.json({ error: 'Media type is required' }, { status: 400 });
    }

    // Generate component ID if not provided (for new components)
    const finalComponentId = componentId || new ObjectId().toString();

    // Define validation options based on media type
    let validationOptions;
    let subCategory = `${componentType}/${finalComponentId}`;

    switch (mediaType) {
      case 'image':
        validationOptions = {
          maxSize: 10 * 1024 * 1024, // 10MB for images
          allowedTypes: [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp', 
            'image/svg+xml',
            'image/avif'
          ],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
        };
        break;

      case 'video':
        validationOptions = {
          maxSize: 100 * 1024 * 1024, // 100MB for videos
          allowedTypes: [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/avi',
            'video/mov',
            'video/wmv'
          ],
          allowedExtensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv']
        };
        break;

      case 'document':
        validationOptions = {
          maxSize: 20 * 1024 * 1024, // 20MB for documents
          allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ],
          allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid media type. Must be image, video, or document' }, { status: 400 });
    }

    // Add field name to subcategory for better organization
    if (fieldName) {
      subCategory += `/${fieldName}`;
    }

    // Use FileHandler to save the file
    const result = await FileHandler.saveFile(
      file,
      'components',
      subCategory,
      validationOptions,
      fieldName ? `${fieldName}_${Date.now()}` : undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url,
      componentId: finalComponentId,
      mediaType,
      fieldName,
      message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`
    });

  } catch (error) {
    console.error('Component media upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET method to retrieve component media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get('componentId');
    const componentType = searchParams.get('componentType');
    const fieldName = searchParams.get('fieldName');

    if (!componentId || !componentType) {
      return NextResponse.json({ error: 'Component ID and type are required' }, { status: 400 });
    }

    // Build the path to list files
    let subCategory = `${componentType}/${componentId}`;
    if (fieldName) {
      subCategory += `/${fieldName}`;
    }

    // List files in the component directory
    const files = FileHandler.listFiles('components', subCategory);

    const fileList = files.map(fileName => {
      const filePath = `uploads/components/${subCategory}/${fileName}`;
      return {
        fileName,
        filePath,
        url: `/api/files/serve?path=${encodeURIComponent(filePath)}`
      };
    });

    return NextResponse.json({
      success: true,
      files: fileList,
      componentId,
      componentType,
      fieldName
    });

  } catch (error) {
    console.error('Component media retrieval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE method to remove component media files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Security check: ensure the path is within the components upload directory
    if (!filePath.startsWith('uploads/components/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }

    const deleted = FileHandler.deleteFile(filePath);

    if (!deleted) {
      return NextResponse.json({ error: 'File not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      filePath
    });

  } catch (error) {
    console.error('Component media deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}