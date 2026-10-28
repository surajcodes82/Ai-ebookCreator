import { BookOpen, Download, LayoutGrid, PenLine, Sparkles, Wand2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Writing',
    description:
      'Generate ideas, structured outlines and complete chapter content with Google Gemini — then refine every word yourself.',
    points: ['Generate ideas', 'Generate outlines', 'Generate chapter content'],
    accent: 'from-primary-500 to-fuchsia-500',
  },
  {
    icon: BookOpen,
    title: 'Immersive Reader',
    description:
      'A clean, distraction-free reading mode with adjustable font sizes and instant chapter navigation.',
    points: ['Clean read-only mode', 'Adjustable font size', 'Chapter navigation'],
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    icon: Download,
    title: 'One-Click Export',
    description:
      'Turn your finished manuscript into a downloadable PDF or a fully editable DOCX document.',
    points: ['Export to PDF', 'Export to DOCX'],
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: LayoutGrid,
    title: 'eBook Management',
    description:
      'Create, edit, delete and organise every eBook from a single dashboard that only you can access.',
    points: ['Create & edit', 'Delete securely', 'Manage everything'],
    accent: 'from-emerald-500 to-teal-500',
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-y border-slate-200/70 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Wand2 size={13} /> Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to publish
          </h2>
          <p className="mt-3 text-slate-600">
            From the first idea to the final export, AI eBook Creator covers the whole workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group card p-6 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-pop"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-sm`}
                >
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-center text-xs font-medium text-slate-600"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 opacity-0 transition group-hover:opacity-100">
                  <PenLine size={14} /> Included
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
