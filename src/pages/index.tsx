import dynamic from 'next/dynamic';
const NavBar = dynamic(() => import('../components/NavBar'), { ssr: false });
const Hero = dynamic(() => import('../components/Hero'), { ssr: false });
const PosterSlider = dynamic(() => import('../components/PosterSlider'), { ssr: false });
const Features = dynamic(() => import('../components/Features'), { ssr: false });
const Stats = dynamic(() => import('../components/Stats'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
import SeoHead from '../components/SeoHead';

export default function HomePage() {
  return (
    <>
      <SeoHead page="home" />
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19]">
        <NavBar page="home" />
        <main className="space-y-12 layout-container">
          {/* Hero area with soft gradient overlay */}
          <section className="-mt-10">
            <Hero page="home" />
            <div className="divider-glow" />
          </section>

          {/* Content grid: Posters + Features + Stats side panel */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-grid two-col section-stack">
                <div className="space-y-8">
                  <div className="layout-card animate-slide-in-up">
                    <PosterSlider />
                  </div>
                  <div className="layout-card animate-slide-in-up">
                    <Features page="home" />
                  </div>
                </div>
                <aside className="layout-card animate-slide-in-up">
                  <Stats page="home" />
                </aside>
              </div>
            </div>
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="home" />
        </footer>
      </div>
    </>
  );
}