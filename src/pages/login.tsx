import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';

export default function LoginPage() {
  return (
    <>
      <SeoHead page="login" />
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19]">
        <NavBar page="login" />
        <main>
          <section className="mx-auto max-w-6xl px-6 -mt-10">
            <h1 className="text-3xl font-semibold">Login</h1>
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="login" />
        </footer>
      </div>
    </>
  );
}