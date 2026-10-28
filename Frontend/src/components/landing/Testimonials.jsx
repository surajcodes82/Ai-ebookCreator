import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'I drafted an entire 12-chapter guide over a weekend. The outline generator alone saved me days of planning.',
    name: 'Sarah Mitchell',
    role: 'Content Strategist',
    color: 'from-violet-500 to-fuchsia-400',
    stars: 5,
  },
  {
    quote:
      'The Markdown editor is genuinely good, and exporting a clean PDF takes one click. My clients love the output.',
    name: 'Daniel Okafor',
    role: 'Independent Publisher',
    color: 'from-sky-500 to-cyan-400',
    stars: 5,
  },
  {
    quote:
      'Reordering chapters by drag-and-drop and regenerating a weak section is the workflow I always wanted.',
    name: 'Priya Raghavan',
    role: 'Course Creator',
    color: 'from-amber-500 to-orange-400',
    stars: 4,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by creators
          </h2>
          <p className="mt-3 text-slate-600">Real feedback from people publishing with AI eBook Creator.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="card flex h-full flex-col p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className={index < item.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.color} text-sm font-bold text-white`}
                >
                  {item.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{item.name}</span>
                  <span className="block text-xs text-slate-500">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
