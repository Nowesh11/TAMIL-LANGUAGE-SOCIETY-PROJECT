"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type Member = {
  _id: string;
  name: Bilingual;
  position?: Bilingual;
  role: string;
  bio: Bilingual;
  email: string;
  phone?: string;
  imagePath?: string;
  imageUrl?: string | null;
  department?: string;
  hierarchy?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  joinedDate?: string | Date;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
    website?: string;
  };
  achievements?: string[];
  specializations?: string[];
  languages?: string[];
};

// Dynamic role hierarchy mapping - can be extended based on actual roles in database
const getRoleHierarchy = (role: string): number => {
  const hierarchyMap: Record<string, number> = {
    'President': 1,
    'Vice President': 2,
    'Secretary': 3,
    'Treasurer': 4,
    'Chief Auditor': 5,
    'Auditor': 6,
    'Director': 7,
    'Assistant Director': 8,
    'Manager': 9,
    'Coordinator': 10,
    'Committee Member': 11,
    'Media and Public Relations Committee Member': 11,
    'Sports and Leadership Committee Member': 11,
    'Education and Intellectual Committee Member': 11,
    'Arts & Culture Committee Member': 11,
    'Social Welfare & Voluntary Committee Member': 11,
    'Language and Literature Committee Member': 11,
    'Advisor': 12,
    'Member': 13
  };
  return hierarchyMap[role] || 99;
};

export default function TeamHierarchy() {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/team?sort=hierarchy');
        const json = await res.json();
        const list = Array.isArray(json.members) ? (json.members as Member[]) : [];
        setMembers(list);
        if (!list.length) setError('No team members found');
      } catch (e) {
        console.error('Failed to load team hierarchy', e);
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groupedMembers = useMemo(() => {
    if (!members.length) return {};

    // Sort members by hierarchy (using database hierarchy field or role-based hierarchy)
    const sortedMembers = [...members].sort((a, b) => {
      const aHierarchy = a.hierarchy || getRoleHierarchy(a.role);
      const bHierarchy = b.hierarchy || getRoleHierarchy(b.role);
      return aHierarchy - bHierarchy;
    });

    // Group members dynamically based on their hierarchy level
    const groups: Record<string, Member[]> = {};
    
    sortedMembers.forEach(member => {
      const hierarchy = member.hierarchy || getRoleHierarchy(member.role);
      let groupName = '';
      
      if (hierarchy === 1) {
        groupName = 'Leadership';
      } else if (hierarchy <= 4) {
        groupName = 'Executive Committee';
      } else if (hierarchy <= 6) {
        groupName = 'Auditors';
      } else if (hierarchy <= 11) {
        groupName = 'Committee Members';
      } else {
        groupName = 'Members';
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(member);
    });

    return groups;
  }, [members]);

  const Card = ({ m }: { m: Member }) => {
    const [showContact, setShowContact] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getImageSrc = () => {
      if (imageError) {
        return '/images/default-avatar.png';
      }
      
      // Priority: imagePath (from upload) > imageUrl (external) > default
      if (m.imagePath) {
        return `/api/files/serve?path=${encodeURIComponent(m.imagePath)}`;
      }
      
      if (m.imageUrl) {
        // Handle full URLs (external images)
        if (m.imageUrl.startsWith('http')) {
          return m.imageUrl;
        }
        // Handle relative paths
        return m.imageUrl.startsWith('/') ? m.imageUrl : `/${m.imageUrl}`;
      }
      
      return '/images/default-avatar.png';
    };

    // Use position if available, otherwise fall back to role
    const displayRole = m.position ? m.position : { en: m.role, ta: m.role };
    const joinedYear = m.joinedDate ? new Date(m.joinedDate as Date).getFullYear() : null;
    
    return (
      <div 
        className="group relative rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-6 bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
        onMouseEnter={() => setShowContact(true)}
        onMouseLeave={() => setShowContact(false)}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden border-4 border-blue-400 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                <Image 
                  src={getImageSrc()} 
                  alt={m.name?.[lang] || m.name?.en || ''} 
                  width={160} 
                  height={160} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  onError={() => setImageError(true)}
                />
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Status indicator */}
              {m.isActive && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg animate-pulse" />
              )}
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {m.name?.[lang] || m.name?.en || ''}
                </h3>
                <p className="text-base lg:text-lg text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  {displayRole?.[lang] || displayRole?.en || m.role}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {m.department && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-700">
                    <i className="fa-solid fa-building fa-sm" />
                    {m.department || ''}
                  </span>
                )}
                {joinedYear && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-200 dark:border-purple-700">
                    <i className="fa-solid fa-calendar-days fa-sm" />
                    {lang === 'en' ? 'Joined' : 'சேர்ந்தது'} {joinedYear}
                  </span>
                )}
                {m.isFeatured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium border border-yellow-200 dark:border-yellow-700">
                    <i className="fa-solid fa-star fa-sm" />
                    {lang === 'en' ? 'Featured' : 'சிறப்பு'}
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                {m.bio?.[lang] || m.bio?.en || ''}
              </p>

              {/* Social Links */}
              {m.socialLinks && Object.keys(m.socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4">
                  {m.socialLinks.linkedin && (
                    <a 
                      href={m.socialLinks.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 hover:scale-110 transition-all duration-300 border border-blue-200 dark:border-blue-700"
                      title="LinkedIn"
                    >
                      <i className="fa-brands fa-linkedin fa-lg" />
                    </a>
                  )}
                  {m.socialLinks.github && (
                    <a 
                      href={m.socialLinks.github} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:scale-110 transition-all duration-300 border border-gray-200 dark:border-gray-700"
                      title="GitHub"
                    >
                      <i className="fa-brands fa-github fa-lg" />
                    </a>
                  )}
                  {m.socialLinks.twitter && (
                    <a 
                      href={m.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-200 dark:hover:bg-sky-800/50 hover:scale-110 transition-all duration-300 border border-sky-200 dark:border-sky-700"
                      title="Twitter"
                    >
                      <i className="fa-brands fa-twitter fa-lg" />
                    </a>
                  )}
                  {m.socialLinks.facebook && (
                    <a 
                      href={m.socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 hover:scale-110 transition-all duration-300 border border-blue-200 dark:border-blue-700"
                      title="Facebook"
                    >
                      <i className="fa-brands fa-facebook fa-lg" />
                    </a>
                  )}
                  {m.socialLinks.instagram && (
                    <a 
                      href={m.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-800/50 hover:scale-110 transition-all duration-300 border border-pink-200 dark:border-pink-700"
                      title="Instagram"
                    >
                      <i className="fa-brands fa-instagram fa-lg" />
                    </a>
                  )}
                  {m.socialLinks.website && (
                    <a 
                      href={m.socialLinks.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800/50 hover:scale-110 transition-all duration-300 border border-green-200 dark:border-green-700"
                      title="Website"
                    >
                      <i className="fa-solid fa-globe fa-lg" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Details Hover Card */}
          <div className={`absolute top-4 right-4 transition-all duration-300 ${showContact ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 min-w-[250px]">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-address-card text-blue-500" />
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Contact Details' : 'தொடர்பு விவரங்கள்'}
                </h4>
              </div>
              
              {m.email && (
                <div className="flex items-center gap-3 mb-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <i className="fa-solid fa-envelope text-blue-500 w-4" />
                  <a 
                    href={`mailto:${m.email}`} 
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
                  >
                    {m.email}
                  </a>
                </div>
              )}
              
              {m.phone && (
                <div className="flex items-center gap-3 mb-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <i className="fa-solid fa-phone text-green-500 w-4" />
                  <a 
                    href={`tel:${m.phone}`} 
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    {m.phone}
                  </a>
                </div>
              )}
              
              {(!m.email && !m.phone) && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  {lang === 'en' ? 'No contact details available' : 'தொடர்பு விவரங்கள் இல்லை'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="text-3xl font-bold mb-6 text-center">{lang === 'en' ? 'Our Team' : 'எங்கள் குழு'}</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-black/5 dark:border-white/10 p-6 bg-white/80 dark:bg-white/[0.03]">
              <div className="flex items-center gap-6 animate-pulse">
                <div className="w-40 h-40 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <p className="text-red-700 dark:text-red-300">{lang === 'en' ? 'Unable to load team.' : 'எங்கள் குழுவை ஏற்ற முடியவில்லை.'}</p>
        </div>
      ) : (
        <>
          {Object.entries(groupedMembers).map(([groupName, groupMembers]) => {
            if (!groupMembers.length) return null;
            
            // Determine grid layout based on group type
            const isLeadership = groupName === 'Leadership';
            const gridClass = isLeadership 
              ? "grid grid-cols-1 gap-6 mb-8"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8";
            
            return (
              <div key={groupName} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  {lang === 'en' ? groupName : (
                    groupName === 'Leadership' ? 'தலைமை' :
                    groupName === 'Executive Committee' ? 'நிர்வாக குழு' :
                    groupName === 'Auditors' ? 'தணிக்கையாளர்கள்' :
                    groupName === 'Committee Members' ? 'குழு உறுப்பினர்கள்' :
                    'உறுப்பினர்கள்'
                  )}
                </h3>
                <div className={gridClass}>
                  {groupMembers.map((m) => <Card key={m._id} m={m} />)}
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}