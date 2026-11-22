import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { prettyDay } from '../../utils/experiences';

const PackageBanner = ({ pkg }) => (
  <Link
    to={`/experiences/packages/${pkg.slug}`}
    className="group relative block overflow-hidden rounded-2xl text-white shadow-soft"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-primary-800 to-accent" />
    {pkg.hero_image && <img src={pkg.hero_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" />}
    <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">{pkg.eyebrow || 'Package'}</p>
        <h3 className="font-display text-2xl sm:text-3xl font-bold mt-1">{pkg.title}</h3>
        <p className="text-sm text-white/85 mt-2 flex items-center gap-1.5">
          <CalendarDays size={14} /> {prettyDay(pkg.start_date)} – {prettyDay(pkg.end_date)}
          {pkg.items?.length ? <> · stay + {pkg.items.length} experience{pkg.items.length !== 1 ? 's' : ''}</> : null}
        </p>
        {pkg.tagline && <p className="text-sm text-white/90 mt-2">{pkg.tagline}</p>}
      </div>
      <span className="inline-flex items-center gap-2 self-start sm:self-auto bg-white text-dark-900 font-semibold text-sm px-5 py-3 rounded-full group-hover:gap-3 transition-all">
        View the package <ArrowRight size={16} />
      </span>
    </div>
  </Link>
);

export default PackageBanner;
