import { Link } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import Stats from '../components/landing/Stats';
import Features from '../components/landing/Features';
import Testimonials from '../components/landing/Testimonials';
import LandingFooter from '../components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHeader />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Testimonials />

        <section className="border-t border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Ready to write your next eBook?
            </h2>
            <p className="mt-3 text-slate-600">
              Create an account and generate your first AI outline in under a minute.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary px-5 py-3 text-base">
                Start Creating for Free
              </Link>
              <Link to="/login" className="btn-secondary px-5 py-3 text-base">
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
