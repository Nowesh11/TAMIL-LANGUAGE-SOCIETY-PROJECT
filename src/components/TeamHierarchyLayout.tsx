"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };

interface TeamMember {
  _id: string;
  name: Bilingual;
  role: string;
  bio: Bilingual;
  email: string;
  phone?: string;
  imagePath?: string;
  imageUrl?: string | null;
  department?: string;
  orderNum: number;
  isActive?: boolean;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
    website?: string;
  };
}

interface TeamHierarchyLayoutProps {
  page?: string;
  data?: {
    title?: Bilingual;
    subtitle?: Bilingual;
  };
  title?: Bilingual;
  subtitle?: Bilingual;
}

export default function TeamHierarchyLayout({ page, data, title, subtitle }: TeamHierarchyLayoutProps) {
  const componentTitle = data?.title || title;
  const componentSubtitle = data?.subtitle || subtitle;
  const { lang } = useLanguage();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const response = await fetch('/api/team?sort=hierarchy');
        const data = await response.json();
        
        if (data.members && Array.isArray(data.members)) {
          // Sort by orderNum to get the hierarchy
          const sortedMembers = data.members.sort((a: TeamMember, b: TeamMember) => a.orderNum - b.orderNum);
          setMembers(sortedMembers);
        } else {
          setError('Failed to load team members');
        }
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team members');
      } finally {
        setLoading(false);
      }
    }

    loadTeamMembers();
  }, []);

  const getImageSrc = (member: TeamMember) => {
    if (member.imagePath) {
      return `/api/files/serve?path=${encodeURIComponent(member.imagePath)}`;
    }
    
    if (member.imageUrl) {
      if (member.imageUrl.startsWith('http')) {
        return member.imageUrl;
      }
      return member.imageUrl.startsWith('/') ? member.imageUrl : `/${member.imageUrl}`;
    }
    
    return '/images/default-avatar.png';
  };

  // Organize members by position based on orderNum
  // Position 0 = top (1 member)
  // Position 1 = below top (3 members)  
  // Position 2 = right of position 1 (3 members)
  // Position 3 = right of position 2 (3 members)
  // Position 4 = below position 1 (3 members)
  // Position 5+ = continue pattern
  const organizeByPosition = (members: TeamMember[]) => {
    const positions: { [key: number]: TeamMember[] } = {};
    
    members.forEach((member, index) => {
      let position = 0;
      
      if (index === 0) {
        position = 0; // Top position
      } else if (index >= 1 && index <= 3) {
        position = 1; // Below top
      } else if (index >= 4 && index <= 6) {
        position = 2; // Right of position 1
      } else if (index >= 7 && index <= 9) {
        position = 3; // Right of position 2
      } else if (index >= 10 && index <= 12) {
        position = 4; // Below position 1
      } else {
        // Continue pattern for additional members
        const remaining = index - 13;
        position = 5 + Math.floor(remaining / 3);
      }
      
      if (!positions[position]) {
        positions[position] = [];
      }
      positions[position].push(member);
    });
    
    return positions;
  };

  const MemberCard = ({ member, size = 'normal' }: { member: TeamMember; size?: 'large' | 'normal' }) => {
    const isLarge = size === 'large';
    const cardClass = isLarge 
      ? "bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-3 border border-slate-200 dark:border-slate-700"
      : "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 dark:border-slate-700";
    
    const imageSize = isLarge ? 160 : 120;
    const imageClass = isLarge ? "w-40 h-40" : "w-30 h-30";

    return (
      <div className={`group ${cardClass}`}>
        {/* Profile Image */}
        <div className="relative mb-6">
          <div className={`${imageClass} mx-auto rounded-full overflow-hidden border-4 border-blue-400 shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
            <Image
              src={getImageSrc(member)}
              alt={member.name[lang] || member.name.en}
              width={imageSize}
              height={imageSize}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          {member.isActive && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-lg"></div>
          )}
        </div>

        {/* Member Info */}
        <div className="text-center">
          <h3 className={`${isLarge ? 'text-2xl' : 'text-xl'} font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300`}>
            {member.name[lang] || member.name.en}
          </h3>
          <p className={`text-blue-600 dark:text-blue-400 font-semibold mb-3 ${isLarge ? 'text-lg' : 'text-base'}`}>
            {member.role}
          </p>
          <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${isLarge ? 'text-base' : 'text-sm'}`}>
            {member.bio[lang] || member.bio.en}
          </p>

          {/* Social Links */}
          {member.socialLinks && (
            <div className="flex justify-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {member.socialLinks.linkedin && (
                <a
                  href={member.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                >
                  <i className="fab fa-linkedin-in text-sm"></i>
                </a>
              )}
              {member.socialLinks.twitter && (
                <a
                  href={member.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors duration-200"
                >
                  <i className="fab fa-twitter text-sm"></i>
                </a>
              )}
              {member.socialLinks.facebook && (
                <a
                  href={member.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800 text-white rounded-full flex items-center justify-center hover:bg-blue-900 transition-colors duration-200"
                >
                  <i className="fab fa-facebook-f text-sm"></i>
                </a>
              )}
              {member.socialLinks.instagram && (
                <a
                  href={member.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <i className="fab fa-instagram text-sm"></i>
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors duration-200"
                >
                  <i className="fas fa-envelope text-sm"></i>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const defaultTitle = { en: "Our Team Hierarchy", ta: "எங்கள் குழு படிநிலை" };
  const defaultSubtitle = { en: "Meet the dedicated individuals leading our organization", ta: "எங்கள் அமைப்பை வழிநடத்தும் அர்ப்பணிப்புள்ள நபர்களை சந்திக்கவும்" };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              {(componentTitle || defaultTitle)[lang]}
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-700 dark:text-red-300">
                {lang === 'en' ? 'Unable to load team members.' : 'குழு உறுப்பினர்களை ஏற்ற முடியவில்லை.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const positions = organizeByPosition(members);

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
            {(componentTitle || defaultTitle)[lang]}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            {(componentSubtitle || defaultSubtitle)[lang]}
          </p>
        </div>

        {/* Hierarchical Layout */}
        <div className="space-y-12">
          {Object.entries(positions)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([position, positionMembers]) => {
              const pos = parseInt(position);
              
              if (pos === 0) {
                // Top position - single large card centered
                return (
                  <div key={position} className="flex justify-center">
                    <div className="w-full max-w-md">
                      {positionMembers[0] && <MemberCard member={positionMembers[0]} size="large" />}
                    </div>
                  </div>
                );
              } else {
                // Other positions - 3 cards in a row
                return (
                  <div key={position} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {positionMembers.map((member) => (
                      <MemberCard key={member._id} member={member} />
                    ))}
                  </div>
                );
              }
            })}
        </div>

        {/* Connection Lines (Optional Visual Enhancement) */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'en' 
              ? 'Organizational structure based on hierarchy and responsibilities' 
              : 'படிநிலை மற்றும் பொறுப்புகளின் அடிப்படையில் அமைப்பு கட்டமைப்பு'
            }
          </p>
        </div>
      </div>
    </section>
  );
}