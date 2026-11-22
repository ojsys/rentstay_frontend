import { useQuery } from '@tanstack/react-query';
import { experiencesAPI } from '../services/api';

/**
 * Whether Experiences is open to this viewer, plus the category list.
 * Staff always see it, so listings can be prepared before launch.
 */
export function useExperiencesMeta() {
  const q = useQuery({
    queryKey: ['experiences-meta'],
    queryFn: () => experiencesAPI.meta().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  return {
    visible: !!q.data?.visible,
    enabled: !!q.data?.enabled,
    categories: q.data?.categories || [],
    trustChecks: q.data?.trust_checks || [],
    locations: q.data?.locations || [],
    commissionRate: q.data?.commission_rate,
    isLoading: q.isLoading,
  };
}
