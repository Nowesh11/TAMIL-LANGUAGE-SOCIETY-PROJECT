"use client";
import React from 'react';

interface IconRendererProps {
  iconName?: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className }) => {
  if (!iconName) return null;

  // Optimized Icon Renderer
  // Previously imported all react-icons which caused performance issues and bundle bloat.
  // Now relies on FontAwesome classes (available via CDN in layout)
  // and attempts to map legacy React Icon names to FontAwesome classes.

  let finalClass = iconName;

  // Heuristic: Check if it looks like a React Icon name (e.g., FaUser, FiHome)
  // and convert to FontAwesome class (e.g., fa-solid fa-user)
  if (!iconName.includes(' ') && /^[A-Z]/.test(iconName)) {
    // Convert PascalCase to kebab-case
    // e.g. FaUser -> -fa-user -> fa-user
    // e.g. FaRegUser -> -fa-reg-user
    
    // Remove common prefixes
    let baseName = iconName;
    if (baseName.startsWith('Fa')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Fi')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Md')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Bi')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Bs')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Hi')) baseName = baseName.substring(2);
    else if (baseName.startsWith('Ai')) baseName = baseName.substring(2);

    // Convert to kebab case
    const kebabName = baseName.replace(/[A-Z]/g, m => "-" + m.toLowerCase()).replace(/^-/, "");
    
    // Default to solid style
    finalClass = `fa-solid fa-${kebabName}`;
  } 
  
  // Robust handling for FontAwesome classes
  else {
     // If it has 'fa-' but missing style class (fas, far, fa-solid, etc), add fa-solid
     // This fixes cases where user inputs "fa-user" instead of "fas fa-user"
     if (finalClass.includes('fa-') && !/fa-(solid|regular|light|thin|duotone|brands)/.test(finalClass) && !/\b(fas|far|fal|fat|fad|fab)\b/.test(finalClass)) {
        finalClass = `fa-solid ${finalClass}`;
     }
     
     // Fallback for simple words like "user" -> "fa-solid fa-user"
     if (!finalClass.includes('fa-') && !finalClass.includes('material-icons')) {
         finalClass = `fa-solid fa-${finalClass}`;
     }
  }

  return <i className={`${finalClass} ${className || ''}`} aria-hidden="true"></i>;
};
