"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type CountdownContent = {
  title: Bilingual;
  subtitle?: Bilingual;
  targetDate: string;
  timezone?: string;
  labels: {
    days: Bilingual;
    hours: Bilingual;
    minutes: Bilingual;
    seconds: Bilingual;
  };
  expiredMessage: Bilingual;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export default function Countdown({ page = 'home', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<CountdownContent | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as CountdownContent);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const res = await fetch(`/api/components/page?page=${encodeURIComponent(page)}`);
        const json = await res.json();
        const list = Array.isArray(json.components) ? json.components : [];
        const record = list.find((c: any) => c.type === 'countdown');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load countdown', e);
      }
    }
    load();
  }, [page, propData]);

  useEffect(() => {
    if (!data?.targetDate) return;

    const calculateTimeLeft = () => {
      const targetTime = new Date(data.targetDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [data?.targetDate]);

  if (!data) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center text-slate-500 dark:text-slate-400">
          {lang === 'en' ? 'Countdown content not available' : 'கவுண்ட்டவுன் உள்ளடக்கம் கிடைக்கவில்லை'}
        </div>
      </section>
    );
  }

  if (isExpired) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10 text-center">
        <h2 className="text-3xl font-bold mb-4">{data.title?.[lang] || data.title?.en || ''}</h2>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          {data.expiredMessage?.[lang] || data.expiredMessage?.en || ''}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 text-center">
      <h2 className="text-3xl font-bold mb-4">{data.title?.[lang] || data.title?.en || ''}</h2>
      {data.subtitle && (
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          {data.subtitle?.[lang] || data.subtitle?.en || ''}
        </p>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{timeLeft.days}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {data.labels?.days?.[lang] || data.labels?.days?.en || 'Days'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{timeLeft.hours}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {data.labels?.hours?.[lang] || data.labels?.hours?.en || 'Hours'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{timeLeft.minutes}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {data.labels?.minutes?.[lang] || data.labels?.minutes?.en || 'Minutes'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{timeLeft.seconds}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {data.labels?.seconds?.[lang] || data.labels?.seconds?.en || 'Seconds'}
          </div>
        </div>
      </div>
    </section>
  );
}