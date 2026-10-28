const GROUP_ONE = [
  { value: '50K+', label: 'Books Created' },
  { value: '4.9/5', label: 'User Rating' },
  { value: '10min', label: 'Avg. Creation' },
];

const GROUP_TWO = [
  { value: '50K+', label: 'Happy Creators' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '100K+', label: 'eBooks Created' },
];

function Row({ items, className = '' }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-3 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{item.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function Stats() {
  return (
    <>
      <section className="border-y border-slate-200/70 bg-gradient-to-b from-white to-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Row items={GROUP_ONE} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(139,92,246,.35),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="mb-10 text-center text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">
            Trusted at scale
          </p>
          <Row
            items={GROUP_TWO}
            className="[&>div>p:first-child]:text-white [&>div>p:last-child]:text-slate-400"
          />
        </div>
      </section>
    </>
  );
}
