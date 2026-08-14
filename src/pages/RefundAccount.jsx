import { Banknote, ShieldCheck, Info } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import BankAccountsManager from '../components/dashboard/BankAccountsManager';

/**
 * Where a guest or tenant saves the account their refunds should be paid to.
 *
 * Saving one in advance matters: otherwise the first time anybody asks for bank
 * details is the moment they are already unhappy about a cancellation, and the
 * refund waits on them replying.
 */
const RefundAccount = () => (
  <DashboardShell>
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Banknote size={22} /> Refund Account
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Where we send money back to you — refunds on cancelled stays, and
          caution fees at the end of a tenancy.
        </p>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-sky-900">
          <p className="font-semibold">The account must be in your own name</p>
          <p className="text-xs text-sky-800 mt-0.5">
            We confirm the account with your bank and check the registered name against
            the name on your profile. An account in someone else&apos;s name cannot receive
            your refund without manual review, which delays it.
          </p>
        </div>
      </div>

      <BankAccountsManager
        title="Your accounts"
        description="Add the account you would like refunds paid into."
      />

      <p className="text-xs text-dark-400 flex items-start gap-1.5">
        <Info size={12} className="mt-0.5 flex-shrink-0" />
        Add this before you need it — when a refund is approved we use your saved
        account automatically, so there is nothing more for you to do.
      </p>
    </div>
  </DashboardShell>
);

export default RefundAccount;
