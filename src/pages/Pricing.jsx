import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Loader2, Check, TrendingUp, Shield, CreditCard,
  Users, Building2, Sparkles, HelpCircle, Percent, ArrowRight, Home as HomeIcon
} from 'lucide-react';

// Current platform commission rates (see SiteSettings on the backend).
const RENT_COMMISSION = '1.5%';
const STAYS_SERVICE_FEE = '15%';

const Pricing = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await pagesAPI.getPage('pricing');
        setPage(response.data);
        document.title = `${response.data.title || 'Pricing'} | RentStay`;
      } catch (err) {
        console.error('Error fetching page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const tenantFeatures = [
    { text: 'Browse all verified listings' },
    { text: 'Contact landlords & hosts directly' },
    { text: 'Submit rental applications' },
    { text: 'Secure payment processing' },
    { text: 'Digital rental agreements' },
    { text: '5% cashback on your caution fee' },
    { text: 'Maintenance request system' },
    { text: 'Book short stays by the night' },
  ];

  const commissionPlans = [
    {
      key: 'rent',
      icon: Building2,
      iconBg: 'bg-primary',
      ring: 'ring-primary/20',
      title: 'Long-term Rentals',
      rate: RENT_COMMISSION,
      rateNote: 'per rent payment',
      summary: 'A flat platform fee added on top of each rent payment.',
      points: [
        'Free to list — no subscription, no limits',
        'Tenant pays rent + 1.5% platform fee',
        'Landlords receive 100% of their rent',
        'Applies to every rent payment made on RentStay',
      ],
    },
    {
      key: 'stays',
      icon: Sparkles,
      iconBg: 'bg-accent',
      ring: 'ring-accent/20',
      title: 'Short Stays',
      rate: STAYS_SERVICE_FEE,
      rateNote: 'host commission per booking',
      summary: 'A commission deducted from the host’s payout — guests pay no added fee.',
      points: [
        'Free to list your space — no subscription',
        'Host pays a 15% commission per booking',
        'Guests pay no added service fee',
        'Deducted from each confirmed booking payout',
      ],
    },
  ];

  const cautionFeeInfo = [
    { icon: Shield, title: 'Secure & Protected', description: 'Your caution fee is held securely and fully tracked' },
    { icon: TrendingUp, title: '5% Annual Cashback', description: 'Your deposit grows while you rent - earn passive income' },
    { icon: CreditCard, title: '100% Refundable', description: 'Get your full deposit back plus cashback when you move out' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-gray-900 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Percent size={18} className="text-accent" />
              <span className="text-sm font-medium">Simple, commission-based pricing</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'Pricing'}
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
              {page?.subtitle || 'Free to join. No subscriptions. We only earn a small fee when you transact.'}
            </p>
          </div>
        </div>
      </section>

      {/* Free to join band */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-5">
              <Check size={28} />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Free for everyone to join
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tenants, landlords, agents and hosts can all sign up and use RentStay for free —
              no subscription, no monthly charges, no property limits. We only earn a small
              commission when a payment goes through.
            </p>
          </div>
        </div>
      </section>

      {/* Commission model */}
      <section className="py-14 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 text-primary mb-4">
              <Percent size={22} />
              <span className="font-semibold uppercase tracking-wider text-sm">How pricing works</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              One small fee, only when you transact
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our commission is transparent and shown before every payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {commissionPlans.map((plan) => (
              <div key={plan.key} className={`bg-white rounded-3xl shadow-soft p-8 ring-1 ${plan.ring}`}>
                <div className={`w-14 h-14 ${plan.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                  <plan.icon className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.rate}</span>
                  <span className="text-gray-500">{plan.rateNote}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.summary}</p>
                <ul className="space-y-3">
                  {plan.points.map((text, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-gray-700">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary inline-flex items-center justify-center gap-1.5">
              <HomeIcon size={18} /> List a property
            </Link>
            <Link to="/stays/listings/new" className="btn btn-secondary inline-flex items-center justify-center gap-1.5">
              <Sparkles size={18} /> Host a short stay
            </Link>
          </div>
        </div>
      </section>

      {/* Tenant / guest free section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Users size={24} />
                <span className="font-semibold uppercase tracking-wider text-sm">For Tenants & Guests</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                Free to find your home
              </h2>
              <p className="text-xl text-gray-600">
                No subscription fees. You only pay rent, a refundable caution fee, and a small
                platform fee shown upfront at checkout.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border-2 border-green-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <span className="text-5xl md:text-6xl font-bold text-gray-900">FREE</span>
                  <p className="text-gray-600 mt-2">Forever free to browse & apply</p>
                </div>
                <Link to="/register" className="btn btn-primary btn-lg mt-6 md:mt-0">
                  Create Free Account
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenantFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white" size={14} />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution Fee Explanation */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                About the Caution Fee
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cautionFeeInfo.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="text-primary" size={28} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-6">
                The caution fee is <strong>10% of annual rent</strong> - fully refundable when you move out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CMS Content Section - Displays content from backend */}
      {page?.content && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-10">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Questions About Pricing?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              We're here to help you understand our commission model
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary">
                Contact Us
              </Link>
              <Link to="/how-it-works" className="btn btn-secondary inline-flex items-center gap-1.5">
                Learn How It Works <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join RentStay today — free to sign up, for everyone.
          </p>
          <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
