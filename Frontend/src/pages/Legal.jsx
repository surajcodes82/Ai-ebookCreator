import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingFooter from '../components/landing/LandingFooter';
import LandingHeader from '../components/landing/LandingHeader';

const SECTIONS = [
  {
    id: 'about',
    title: 'About Us',
    body: [
      'AI eBook Creator is a full-stack writing workspace that helps authors go from an idea to a finished, exportable eBook.',
      'The product combines a structured chapter workflow with AI-assisted drafting, a real Markdown editor and server-side PDF/DOCX export, so nothing in the pipeline is a mock-up.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      'Questions, bug reports or feature requests are welcome. Reach out through the support channel provided with your hosting environment, or open an issue in the project repository.',
      'When reporting a problem, include the page you were on and the exact error message you saw.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'We store your name, email address and a bcrypt hash of your password. Plain-text passwords are never written to the database and cannot be recovered.',
      'The eBooks, chapters and cover images you create belong to your account. They are only ever returned to an authenticated request signed with your own token, and the API rejects any attempt to read another user’s books.',
      'AI requests send only the book context needed to generate your outline or chapter. Your JWT is kept in your browser’s local storage and expires after seven days.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      'You are responsible for the content you generate and publish. Do not use the service for material that infringes the rights of others or violates applicable law.',
      'The service is provided as-is, without warranty of any kind. Export your work regularly — deleting an eBook permanently removes its chapters and cover image.',
    ],
  },
];

export default function Legal() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-primary-600">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
          About & Legal Information
        </h1>
        <p className="mt-2 text-slate-500">
          Everything you need to know about how AI eBook Creator handles your data.
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="card scroll-mt-24 p-6">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
