import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, Building2, Sparkles, Shield, TrendingUp, CreditCard, Users,
  Percent, ArrowRight, Gift, ChevronDown, Calculator, Home as HomeIcon,
} from 'lucide-react';
import { fillTokens, formatToken, visibleLines, offerIsOn, naira } from '../../utils/pricingText';

// Renders the pricing page from editable content + live rates. Used by the
// public page and, unchanged, by the staff editor's live preview — so what
// staff see while editing is exactly what visitors get.

const CAUTION_ICONS = [Shield, TrendingUp, CreditCard];

const Eyebrow = ({ icon: Icon, children, tone = 'text-primary' }) => (
  <div className={`inline-flex items-center gap-2 ${tone} mb-3`}>
    {Icon && <Icon size={18} />}
    <span className="font-semibold uppercase tracking-wider text-xs md:text-sm">{children}</span>
  </div>
);

const NumberField = ({ label, value, onChange, prefix, min = 0, step = 1 }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
    <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
      {prefix && <span className="pl-3 text-gray-400 text-sm">{prefix}</span>}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(min, Number(e.target.value)))}
        className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 outline-none"
      />
    </div>
  </label>
);

const Row = ({ label, value, strong, tone = 'text-gray-900' }) => (
  <div className={`flex items-center justify-between gap-4 ${strong ? 'pt-2 mt-1 border-t border-gray-200' : ''}`}>
    <span className={`text-sm ${strong ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-sm tabular-nums ${strong ? 'font-bold' : 'font-medium'} ${tone}`}>{value}</span>
  </div>
);

// Worked examples use the live rate and the same formulas as the backend:
// rent fee = rent × rate, paid by the tenant on top; stays commission =
// nightly subtotal × rate, deducted from the host (cleaning passes through).
const RentExample = ({ rate }) => {
  const [rent, setRent] = useState(1200000);
  const fee = (Number(rent) || 0) * rate / 100;
  return (
    <div className="rounded-2xl bg-gray-50 p-4 md:p-5">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-3">
        <Calculator size={16} className="text-primary" /> Try it
      </div>
      <NumberField label="Annual rent" prefix="₦" value={rent} onChange={setRent} step={50000} />
      <div className="mt-4 space-y-1.5">
        <Row label="Rent" value={naira(rent)} />
        <Row label={`Platform fee (${rate}%)`} value={naira(fee)} />
        <Row label="Tenant pays" value={naira((Number(rent) || 0) + fee)} strong />
        <Row label="Landlord receives" value={naira(rent)} tone="text-green-700" />
      </div>
    </div>
  );
};

const StaysExample = ({ rate, freeBookings }) => {
  const [nightly, setNightly] = useState(40000);
  const [nights, setNights] = useState(3);
  const [cleaning, setCleaning] = useState(10000);
  const subtotal = (Number(nightly) || 0) * (Number(nights) || 0);
  const commission = subtotal * rate / 100;
  const total = subtotal + (Number(cleaning) || 0);
  return (
    <div className="rounded-2xl bg-gray-50 p-4 md:p-5">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-3">
        <Calculator size={16} className="text-accent-600" /> Try it
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Nightly rate" prefix="₦" value={nightly} onChange={setNightly} step={5000} />
        <NumberField label="Nights" value={nights} onChange={setNights} min={1} />
      </div>
      <div className="mt-3">
        <NumberField label="Cleaning fee" prefix="₦" value={cleaning} onChange={setCleaning} step={1000} />
      </div>
      <div className="mt-4 space-y-1.5">
        <Row label="Guest pays" value={naira(total)} />
        <Row label={`Commission (${rate}% of nightly total)`} value={`− ${naira(commission)}`} />
        <Row label="You receive" value={naira(total - commission)} strong tone="text-green-700" />
      </div>
      {freeBookings > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          On your first {freeBookings} bookings you keep the full {naira(total)}.
        </p>
      )}
    </div>
  );
};

const PlanCard = ({ plan, icon, rate, accent, rates, example, badge }) => {
  const Icon = icon;
  return (
  <div className={`relative flex flex-col bg-white rounded-3xl shadow-soft ring-1 ${accent.ring} p-6 md:p-8`}>
    {badge && (
      <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow">
        <Gift size={13} /> {badge}
      </span>
    )}
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-12 h-12 ${accent.iconBg} rounded-2xl flex items-center justify-center`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-xl md:text-2xl font-display font-bold text-gray-900">{fillTokens(plan.title, rates)}</h3>
    </div>
    <div className="flex items-baseline gap-2 mb-2">
      <span className="text-5xl md:text-6xl font-display font-bold text-gray-900 tracking-tight">{rate}</span>
      <span className="text-gray-500 text-sm md:text-base">{fillTokens(plan.rate_note, rates)}</span>
    </div>
    <p className="text-gray-600 mb-6">{fillTokens(plan.summary, rates)}</p>
    <ul className="space-y-3 mb-6">
      {visibleLines(plan.points, rates).map((text, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <Check className="text-green-600" size={13} strokeWidth={3} />
          </span>
          <span className="text-gray-700">{fillTokens(text, rates)}</span>
        </li>
      ))}
    </ul>
    <div className="mt-auto">{example}</div>
  </div>
  );
};

const FaqItem = ({ item, rates, defaultOpen }) => (
  <details className="group rounded-2xl border border-gray-200 bg-white open:shadow-soft transition" open={defaultOpen}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 md:px-6 [&::-webkit-details-marker]:hidden">
      <span className="font-semibold text-gray-900">{fillTokens(item.question, rates)}</span>
      <ChevronDown size={18} className="flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
    </summary>
    <p className="px-5 pb-5 md:px-6 text-gray-600 leading-relaxed">{fillTokens(item.answer, rates)}</p>
  </details>
);

const PricingView = ({ content, rates }) => {
  const c = content;
  const t = (text) => fillTokens(text, rates);
  const offer = offerIsOn(rates);
  const freeBookings = Number(rates?.free_bookings) || 0;

  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-dark-900 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="container-custom relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-6 backdrop-blur-sm">
              <Percent size={16} className="text-accent" />
              <span className="text-sm font-medium">{t(c.hero.eyebrow)}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-5 tracking-tight">{t(c.hero.title)}</h1>
            <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto">{t(c.hero.subtitle)}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm text-center">
              <p className="text-3xl font-display font-bold">{formatToken('rent_rate', rates)}</p>
              <p className="text-sm text-white/75">platform fee on rent</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm text-center">
              <p className="text-3xl font-display font-bold">{formatToken('stays_rate', rates)}</p>
              <p className="text-sm text-white/75">host commission on stays</p>
            </div>
            <div className="rounded-2xl bg-accent px-5 py-4 text-center text-dark-900">
              <p className="text-3xl font-display font-bold">₦0</p>
              <p className="text-sm font-medium">to join, list or browse</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free to join ─────────────────────────────────────── */}
      <section className="py-12 md:py-16 border-b border-gray-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">{t(c.free_band.title)}</h2>
              <p className="text-lg text-gray-600">{t(c.free_band.body)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-10 md:mb-14">
            <Eyebrow icon={Percent}>{t(c.plans_intro.eyebrow)}</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">{t(c.plans_intro.title)}</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">{t(c.plans_intro.subtitle)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            <PlanCard
              plan={c.rent_plan}
              icon={Building2}
              rate={formatToken('rent_rate', rates)}
              rates={rates}
              accent={{ iconBg: 'bg-primary', ring: 'ring-primary/20' }}
              example={<RentExample rate={Number(rates?.rent_rate) || 0} />}
            />
            <PlanCard
              plan={c.stays_plan}
              icon={Sparkles}
              rate={formatToken('stays_rate', rates)}
              rates={rates}
              accent={{ iconBg: 'bg-accent', ring: 'ring-accent/30' }}
              badge={offer ? `First ${freeBookings} bookings free` : null}
              example={<StaysExample rate={Number(rates?.stays_rate) || 0} freeBookings={freeBookings} />}
            />
          </div>

          <div className="max-w-5xl mx-auto mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn btn-primary inline-flex items-center justify-center gap-1.5">
              <HomeIcon size={18} /> List a property
            </Link>
            <Link to="/stays/listings/new" className="btn btn-secondary inline-flex items-center justify-center gap-1.5">
              <Sparkles size={18} /> Host a short stay
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tenants & guests ─────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <Eyebrow icon={Users}>{t(c.tenants.eyebrow)}</Eyebrow>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">{t(c.tenants.title)}</h2>
              <p className="text-lg text-gray-600 mb-6">{t(c.tenants.subtitle)}</p>
              <Link to="/register" className="btn btn-primary inline-flex items-center gap-1.5">
                Create a free account <ArrowRight size={16} />
              </Link>
            </div>
            <div className="lg:col-span-3 rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl md:text-5xl font-display font-bold text-gray-900">Free</span>
                <span className="text-gray-600">to browse, apply and book</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleLines(c.tenants.features, rates).map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                      <Check className="text-white" size={12} strokeWidth={3} />
                    </span>
                    <span className="text-gray-700">{t(text)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Caution fee */}
          <div className="max-w-5xl mx-auto mt-14 md:mt-16">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 text-center mb-8">{t(c.caution.title)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {c.caution.cards.map((card, i) => {
                const Icon = CAUTION_ICONS[i % CAUTION_ICONS.length];
                return (
                  <div key={i} className="rounded-2xl bg-gray-50 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1.5">{t(card.title)}</h4>
                    <p className="text-gray-600 text-sm">{t(card.description)}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-gray-600 mt-6">{t(c.caution.footnote)}</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      {c.faq.items.length > 0 && (
        <section className="py-14 md:py-20 bg-gray-50">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8 md:mb-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">{t(c.faq.title)}</h2>
                <p className="text-lg text-gray-600">{t(c.faq.subtitle)}</p>
              </div>
              <div className="space-y-3">
                {c.faq.items.map((item, i) => (
                  <FaqItem key={i} item={item} rates={rates} defaultOpen={i === 0} />
                ))}
              </div>
              <p className="text-center text-gray-600 mt-8">
                Still unsure?{' '}
                <Link to="/contact" className="font-semibold text-primary hover:underline">Contact us</Link>
                {' '}or read{' '}
                <Link to="/how-it-works" className="font-semibold text-primary hover:underline">how it works</Link>.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-14 md:py-16 bg-gradient-to-r from-primary to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{t(c.cta.title)}</h2>
          <p className="text-lg md:text-xl text-white/90 mb-7">{t(c.cta.subtitle)}</p>
          <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
            {t(c.cta.button_label)}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PricingView;
