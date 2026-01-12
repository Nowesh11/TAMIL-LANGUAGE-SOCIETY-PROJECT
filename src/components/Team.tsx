"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Team.css';

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

interface TeamProps {
  page?: string;
  data?: {
    title?: Bilingual;
    subtitle?: Bilingual;
    limit?: number;
  };
  title?: Bilingual;
  subtitle?: Bilingual;
  limit?: number;
}

export default function Team({ page, data, title, subtitle, limit = 6 }: TeamProps) {
  // Use data props if available (from DynamicComponent), otherwise use direct props
  const componentTitle = data?.title || title;
  const componentSubtitle = data?.subtitle || subtitle;
  const componentLimit = data?.limit || limit;
  const { lang } = useLanguage();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const response = await fetch(`/api/team?limit=${componentLimit}&active=true`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members);
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
  }, [componentLimit]);

  const getImageSrc = (member: TeamMember) => {
    // Priority: imagePath (from upload) > imageUrl (external) > default
    if (member.imagePath) {
      return `/api/files/serve?path=${encodeURIComponent(member.imagePath)}`;
    }
    
    if (member.imageUrl) {
      // Handle full URLs (external images)
      if (member.imageUrl.startsWith('http')) {
        return member.imageUrl;
      }
      // Handle relative paths
      return member.imageUrl.startsWith('/') ? member.imageUrl : `/${member.imageUrl}`;
    }
    
    return '/images/default-avatar.png';
  };

  const defaultTitle = { en: "Meet Our Team", ta: "எங்கள் குழுவை சந்திக்கவும்" };
  const defaultSubtitle = { en: "Dedicated individuals working together to preserve and promote Tamil heritage", ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்த ஒன்றாக பணியாற்றும் அர்ப்பணிப்புள்ள நபர்கள்" };

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
              {(title || defaultTitle)[lang]}
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

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member) => (
            <div
              key={member._id}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 dark:border-slate-700"
            >
              {/* Profile Image */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-blue-400 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Image
                    src={getImageSrc(member)}
                    alt={member.name[lang] || member.name.en}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                {/* Status indicator */}
                {member.isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-lg"></div>
                )}
              </div>

              {/* Member Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {member.name[lang] || member.name.en}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
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
          ))}
        </div>

        {/* View All Button */}
        {members.length >= componentLimit && (
          <div className="text-center mt-12">
            <a
              href="/about#team"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {lang === 'en' ? 'View All Team Members' : 'அனைத்து குழு உறுப்பினர்களையும் பார்க்கவும்'}
              <i className="fas fa-arrow-right text-sm"></i>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}