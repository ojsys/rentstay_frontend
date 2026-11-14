import { Lock } from 'lucide-react';
import LegalQueueBoard from '../../components/legal/LegalQueueBoard';
import useAuthStore from '../../store/authStore';
import { isLegalStaff } from '../../utils/legal';

/**
 * Dispute cases inside the staff shell.
 *
 * Being staff is not enough to open this. Cases are private between the person
 * who raised them and the legal team, and a moderator reviewing listing photos
 * has no reason to read a harassment complaint — so the tab explains the
 * refusal rather than rendering an empty queue, which would read as a bug.
 */
const StaffLegal = () => {
  const { user } = useAuthStore();

  if (!isLegalStaff(user)) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto">
        <Lock size={28} className="text-dark-300 mx-auto mb-3" />
        <p className="text-dark-800 font-medium">Legal cases are restricted</p>
        <p className="text-sm text-dark-500 mt-1.5">
          Dispute cases are private between the person who raised them and the
          legal team. Ask an administrator to mark you as a legal partner if you
          need access.
        </p>
      </div>
    );
  }

  return <LegalQueueBoard />;
};

export default StaffLegal;
