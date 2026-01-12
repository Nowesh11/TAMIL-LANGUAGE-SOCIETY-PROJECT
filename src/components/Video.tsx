"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';

interface VideoProps {
  page: string;
  slug?: string;
  data?: any;
}

export default function Video({ page, slug = 'video', data }: VideoProps) {
  const { lang } = useLanguage();
  const [content, setContent] = React.useState<any>(data || null);

  React.useEffect(() => {
    if (data) return;
    async function fetchContent() {
      try {
        const pageContent = await getPageContent(page, 'video', slug);
        setContent(pageContent[slug] || pageContent[`video-0`]);
      } catch (error) {
        console.error('Error fetching video content:', error);
      }
    }
    fetchContent();
  }, [page, slug]);

  if (!content) return null;

  const title = content.title?.[lang] || content.title?.en || '';
  const subtitle = content.subtitle?.[lang] || content.subtitle?.en || '';
  const description = content.description?.[lang] || content.description?.en || '';
  const videoUrl = content.url || '';
  const thumbnailUrl = content.thumbnail || '';
  const autoplay = content.autoplay || false;
  const controls = content.controls !== false; // Default to true
  const muted = content.muted || false;
  const loop = content.loop || false;

  // Function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}${autoplay ? '?autoplay=1' : ''}`;
    }
    return url;
  };

  // Function to get Vimeo embed URL
  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}${autoplay ? '?autoplay=1' : ''}`;
    }
    return url;
  };

  // Determine video type and embed URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isVimeo = videoUrl.includes('vimeo.com');
  const embedUrl = isYouTube 
    ? getYouTubeEmbedUrl(videoUrl)
    : isVimeo 
    ? getVimeoEmbedUrl(videoUrl)
    : videoUrl;

  return (
    <section className="video-section py-16 px-4">
      <div className="video-container max-w-6xl mx-auto">
        <div className="video-content text-center mb-8">
          {title && (
            <h2 className="video-title text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <h3 className="video-subtitle text-xl md:text-2xl font-semibold mb-4 text-gray-700">
              {subtitle}
            </h3>
          )}
          {description && (
            <p className="video-description text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              {description}
            </p>
          )}
        </div>

        <div className="video-wrapper relative w-full max-w-4xl mx-auto">
          <div className="video-aspect-ratio relative w-full h-0 pb-[56.25%] bg-gray-100 rounded-lg overflow-hidden shadow-lg">
            {isYouTube || isVimeo ? (
              <iframe
                src={embedUrl}
                title={title || 'Video'}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                poster={thumbnailUrl}
                controls={controls}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                className="absolute top-0 left-0 w-full h-full object-cover"
              >
                <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500">
                  {lang === 'ta' 
                    ? 'உங்கள் உலாவி வீடியோவை ஆதரிக்கவில்லை.' 
                    : 'Your browser does not support the video tag.'
                  }
                </p>
              </video>
            )}
          </div>

          {/* Video overlay for custom styling */}
          {!isYouTube && !isVimeo && thumbnailUrl && (
            <div className="video-overlay absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
          )}
        </div>

        {/* Video metadata */}
        {(content.duration || content.views) && (
          <div className="video-metadata flex justify-center gap-6 mt-6 text-sm text-gray-500">
            {content.duration && (
              <span className="video-duration">
                {lang === 'ta' ? 'கால அளவு: ' : 'Duration: '}{content.duration}
              </span>
            )}
            {content.views && (
              <span className="video-views">
                {lang === 'ta' ? 'பார்வைகள்: ' : 'Views: '}{content.views.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}