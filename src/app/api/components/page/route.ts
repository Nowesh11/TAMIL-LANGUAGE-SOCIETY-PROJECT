import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Component from '../../../../models/Component';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'home';
    const bureau = searchParams.get('bureau');
    
    // Build query with smart fallback logic
    let components;
    
    if (bureau) {
      // If bureau is specified, filter by bureau
      const query = { page, isActive: true, bureau };
      components = await Component.find(query)
        .sort({ order: 1 })
        .lean();
    } else {
      // If no bureau specified, use smart fallback per component type
      // First get components without bureau
      let generalComponents = await Component.find({ 
        page, 
        isActive: true, 
        bureau: { $exists: false } 
      }).sort({ order: 1 }).lean();
      
      // Get all component types that exist for this page
      const allComponents = await Component.find({ 
        page, 
        isActive: true 
      }).sort({ order: 1 }).lean();
      
      // For each component type, if no general version exists, use bureau-specific fallback
      const componentsByType = new Map();
      
      // First, add all general components
      generalComponents.forEach(comp => {
        if (!componentsByType.has(comp.type)) {
          componentsByType.set(comp.type, []);
        }
        componentsByType.get(comp.type).push(comp);
      });
      
      // Then, for missing types, add bureau-specific components as fallback
      allComponents.forEach(comp => {
        if (!componentsByType.has(comp.type)) {
          componentsByType.set(comp.type, [comp]);
        }
      });
      
      // Flatten back to array and sort by order
      components = Array.from(componentsByType.values())
        .flat()
        .sort((a, b) => a.order - b.order);
    }
    
    // Convert ObjectIds to strings
    const formattedComponents = components.map(component => ({
      ...component,
      _id: (component as any)._id.toString()
    }));
    
    return NextResponse.json({
      success: true,
      page,
      components: formattedComponents,
      total: formattedComponents.length
    });
  } catch (error: any) {
    console.error('Components API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch components' },
      { status: 500 }
    );
  }
}