"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import { FaLinkedin, FaEnvelope, FaPhone } from 'react-icons/fa';

interface Bilingual { en: string; ta: string }

interface TeamMember {
  _id: string;
  name: Bilingual;
  role: string;
  imagePath?: string;
  imageUrl?: string;
  bio?: Bilingual;
  email?: string;
  phone?: string;
  orderNum: number;
}

import { safeFetchJson } from '../lib/safeFetch';
// ...
export default function Team({ page, data }: { page?: string, data?: any }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const { lang } = useLanguage();

  useEffect(() => {
    async function loadTeam() {
      try {
        const json = await safeFetchJson<{ members?: TeamMember[] }>('/api/team');
        if (json.members) {
           setMembers(json.members);
        }
      } catch (e) {
        console.error('Failed to load team', e);
      }
    }
    loadTeam();
  }, []);

  if (!members.length) return null;

  // Filter members by role
  const president = members.find(m => m.role === 'President');
  
  // Leadership: Vice President, Secretary, Treasurer
  const leadership = members.filter(m => ['Vice President', 'Secretary', 'Treasurer'].includes(m.role))
    .sort((a, b) => {
      const order = ['Vice President', 'Secretary', 'Treasurer'];
      return order.indexOf(a.role) - order.indexOf(b.role);
    });
  
  // Executive Committee
  // Exclude President, VP, Secretary, Treasurer, and Auditors
  const allExecutives = members.filter(m => 
    !['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'Chief Auditor'].includes(m.role)
  ).sort((a, b) => a.orderNum - b.orderNum);
  
  const topExecutives = allExecutives.slice(0, 3);
  const midExecutives = allExecutives.slice(3, 6);
  const remainingExecutives = allExecutives.slice(6); // Any extras
  
  // Auditors
  const allAuditors = members.filter(m => ['Auditor', 'Chief Auditor'].includes(m.role))
    .sort((a, b) => (m.role === 'Chief Auditor' ? -1 : 1)); // Chief first if exists
  
  const mainAuditors = allAuditors.slice(0, 3);
  const remainingAuditors = allAuditors.slice(3); // Any extras

  const MemberCard = ({ member, className = '' }: { member: TeamMember, className?: string }) => (
    <div className={`group relative w-72 h-96 card-morphism overflow-hidden hover-lift hover-glow ${className}`}>
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={member.imagePath 
            ? (member.imagePath.startsWith('/') || member.imagePath.startsWith('http') 
                ? member.imagePath 
                : `/api/files/serve?path=${encodeURIComponent(member.imagePath)}`)
            : (member.imageUrl || '/placeholder-avatar.svg')}
          alt={typeof member.name === 'string' ? member.name : (member.name?.[lang] || 'Team Member')}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized
        />
        
        {/* Always visible name tag at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-center transition-all duration-300 group-hover:opacity-0 translate-y-0 group-hover:translate-y-4">
            <h3 className="text-xl font-bold mb-1 drop-shadow-md">
              {typeof member.name === 'string' ? member.name : member.name?.[lang]}
            </h3>
            <p className="text-sm font-medium text-white/90 drop-shadow-sm uppercase tracking-wider">
              {typeof member.role === 'string' ? member.role : (member.role as any)?.[lang]}
            </p>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/95 to-secondary-dark/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center transform scale-95 group-hover:scale-100 transition-transform backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-2">
            {typeof member.name === 'string' ? member.name : member.name?.[lang]}
          </h3>
          <p className="text-sm font-semibold text-primary-light uppercase tracking-widest mb-4">
            {typeof member.role === 'string' ? member.role : (member.role as any)?.[lang]}
          </p>
          
          {member.bio && (
            <p className="text-white/80 text-sm mb-6 line-clamp-4 leading-relaxed">
              {typeof member.bio === 'string' ? member.bio : member.bio?.[lang]}
            </p>
          )}
          
          <div className="flex gap-4 mt-auto">
            {member.email && (
              <a href={`mailto:${member.email}`} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-primary flex items-center justify-center transition-all duration-300" title="Email">
                <FaEnvelope />
              </a>
            )}
            {member.phone && (
              <a href={`tel:${member.phone}`} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-primary flex items-center justify-center transition-all duration-300" title="Phone">
                <FaPhone />
              </a>
            )}
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-primary flex items-center justify-center transition-all duration-300" title="LinkedIn">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-background relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
        <div className="text-center mb-16 animate-slide-in-up">
           <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-title inline-block">
             <span className="animate-text-glow">{data?.title?.[lang] || 'Our Leadership'}</span>
           </h2>
           <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
             {data?.subtitle?.[lang] || 'Meet the dedicated team behind our success'}
           </p>
        </div>

        <div className="flex flex-col items-center gap-12">
          {/* Level 1: President */}
          {president && (
            <div className="flex justify-center w-full animate-slide-in-up">
              <MemberCard member={president} className="scale-110 shadow-2xl border-2 border-primary/20 shadow-primary/20" />
            </div>
          )}

          {/* Level 2: VP, Secretary, Treasurer */}
          {leadership.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 w-full animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              {leadership.map(member => (
                <MemberCard key={member._id} member={member} />
              ))}
            </div>
          )}

          {/* Level 3: First 3 Executives */}
          {topExecutives.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 w-full animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              {topExecutives.map(member => (
                <MemberCard key={member._id} member={member} />
              ))}
            </div>
          )}

          {/* Level 4: Next 3 Executives */}
          {midExecutives.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 w-full animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              {midExecutives.map(member => (
                <MemberCard key={member._id} member={member} />
              ))}
            </div>
          )}

          {/* Level 5: Auditors (Max 3) */}
          {mainAuditors.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 w-full border-t border-border pt-12 mt-4 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              {mainAuditors.map(member => (
                <MemberCard key={member._id} member={member} />
              ))}
            </div>
          )}
          
          {/* Remaining Members (if any) */}
          {(remainingExecutives.length > 0 || remainingAuditors.length > 0) && (
             <div className="flex flex-wrap justify-center gap-8 w-full pt-8 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
               {[...remainingExecutives, ...remainingAuditors].map(member => (
                 <MemberCard key={member._id} member={member} />
               ))}
             </div>
          )}
        </div>
      </div>
    </section>
  );
}
