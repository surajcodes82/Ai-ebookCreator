import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter } from "lucide-react";
import Logo from "../Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Testimonials", to: "/#testimonials" },
      { label: "Get Started", to: "/register" },
      { label: "Sign In", to: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/legal#about" },
      { label: "Contact", to: "/legal#contact" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/legal#privacy" },
      { label: "Terms of Service", to: "/legal#terms" },
    ],
  },
];

const SOCIALS = [
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: Linkedin },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Write, design and export professional eBooks with AI — outlines,
              chapters, covers and one-click PDF or DOCX export.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold text-slate-900">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 transition hover:text-primary-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AI eBook Creator. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Developed By Suraj</p>
        </div>
      </div>
    </footer>
  );
}
