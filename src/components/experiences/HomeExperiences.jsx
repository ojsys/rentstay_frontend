import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass } from 'lucide-react';
import { experiencesAPI } from '../../services/api';
import { useExperiencesMeta } from '../../hooks/useExperiences';
import ExperienceCard from './ExperienceCard';
import PackageBanner from './PackageBanner';

/** Home page: the package banner and the first few experiences on the shelf. */
const HomeExperiences = () => {
  const { visible } = useExperiencesMeta();
  const list = useQuery({
    queryKey: ['experiences-home'],
    queryFn: () => experiencesAPI.list({ limit: 8 }).then(r => r.data.results),
    enabled: visible,
    staleTime: 60 * 1000,
  });
  const packages = useQuery({
    queryKey: ['experience-packages'],
    queryFn: () => experiencesAPI.packages().then(r => r.data),
    enabled: visible,
  });
  const items = list.data || [];
  if (!visible || (!items.length && !(packages.data || []).length)) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container-custom space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Compass size={13} /> New · Experiences
            </div>
            <h2 className="text-4xl font-display font-bold text-dark-900 mb-2">Your stay, with the place attached</h2>
            <p className="text-lg text-dark-600 max-w-2xl">
              Hikes, heritage, food and festivals from local guides — add them to your stay and pay once.
            </p>
          </div>
          <Link to="/experiences" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-600 flex-shrink-0">
            Browse experiences <ArrowRight size={18} />
          </Link>
        </div>
        {(packages.data || []).slice(0, 1).map(p => <PackageBanner key={p.id} pkg={p} />)}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.slice(0, 4).map(e => <ExperienceCard key={e.id} experience={e} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeExperiences;
