import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import Vision from '../components/Vision';
import Mission from '../components/Mission';
import Gallery from '../components/Gallery';
import TeamHierarchy from '../components/TeamHierarchy';


export default function AboutPage() {
  return (
    <>
      <SeoHead page="about" />
      <div className="font-sans min-h-screen aurora-gradient layout-page">
        <NavBar page="about" />
        <main className="space-y-12 layout-container">
          {/* Hero banner with soft overlay */}
          <section className="-mt-10 hero-gradient">
            <div className="layout-container">
              <div className="layout-card animate-fade-in">
                <Hero page="about" />
              </div>
            </div>
            <div className="divider-glow" />
          </section>

          {/* Vision & Mission */}
          <section className="section-gradient-soft layout-section">
            <div className="layout-container">
              <div className="layout-grid section-stack" style={{gridTemplateColumns: '1fr'}}>
                <div className="layout-card animate-slide-in-up">
                  <Vision page="about" />
                </div>
                <div className="layout-card animate-slide-in-up">
                  <Mission page="about" />
                </div>
              </div>
            </div>
          </section>

          {/* Our History: Gallery first, then inline text (no separate component) */}
          <section className="layout-section">
            <div className="layout-container">
              <div id="our-history" className="section-stack">
                <div className="layout-card animate-slide-in-up">
                  <Gallery page="about" slug="our-history-gallery" />
                </div>
                <div className="layout-card animate-slide-in-up">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">A Legacy of Tamil Excellence</h2>
                  <p className="text-muted mb-3">
                    Founded in 2020, the Tamil Language Society emerged from a passionate vision to bridge
                    the gap between traditional Tamil heritage and modern digital accessibility. Our journey began
                    with a small group of Tamil scholars, educators, and technology enthusiasts who recognized the
                    urgent need to preserve and promote Tamil language in the digital age.
                  </p>
                  <p className="text-muted">
                    Over the years, we have grown from a local initiative to a global movement, connecting Tamil
                    communities worldwide and creating innovative platforms for language learning, cultural exchange,
                    and literary preservation. Our commitment to excellence has made us a trusted resource for Tamil
                    language education and cultural promotion.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="layout-section">
            <div className="layout-container">
              <div id="our-team" className="layout-card animate-slide-in-up">
                <TeamHierarchy />
              </div>
            </div>
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="about" />
        </footer>
      </div>
    </>
  );
}