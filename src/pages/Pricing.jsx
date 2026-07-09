import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pagesAPI, plansAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import {
  Loader2, Check, TrendingUp, Shield, CreditCard,
  Users, Building2, Star, Zap, Crown, Sparkles, HelpCircle
} from 'lucide-react';

const PLAN_ICONS = {
  starter: Building2,
  professional: Star,
  professional_plus: Sparkles,
  enterprise: Crown,
};
const PLAN_ICON_BG = {
  starter: 'bg-gray-600',
  professional: 'bg-primary',
  professional_plus: 'bg-accent',
  enterprise: 'bg-dark-800',
};
// The tier we actively promote (RentStay manages caution + earns from the pool).
const POPULAR_PLAN = 'professional_plus';

const formatPrice = (plan) =>
  plan.price === 0 ? 'Free' : `₦${Number(plan.price).toLocaleString()}`;

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscribingTo, setSubscribingTo] = useState(null);
  const [error, setError] = useState('');

  const isLandlord = isAuthenticated && user?.user_type === 'landlord';

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
    const fetchPlans = async () => {
      try {
        const res = await plansAPI.getCatalog();
        setPlans(res.data.plans || []);
        setCurrentPlan(res.data.current?.effective_plan || null);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPage();
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    // Not signed in as a landlord → send them to register first.
    if (!isLandlord) {
      navigate('/register');
      return;
    }
    if (plan.contact_sales) {
      navigate('/contact');
      return;
    }
    if (!plan.is_paid || plan.key === currentPlan) return;

    setError('');
    setSubscribingTo(plan.key);
    try {
      const res = await plansAPI.subscribe(plan.key);
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setError('Could not start checkout. Please try again.');
        setSubscribingTo(null);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not start checkout. Please try again.');
      setSubscribingTo(null);
    }
  };

  const ctaLabel = (plan) => {
    if (plan.key === currentPlan) return 'Current plan';
    if (plan.contact_sales) return 'Contact Sales';
    if (!plan.is_paid) return isLandlord ? 'Included' : 'Get Started';
    return isLandlord ? 'Upgrade' : 'Get Started';
  };

  // Static data for pricing
  const tenantFeatures = [
    { text: 'Browse all verified listings', included: true },
    { text: 'Contact landlords directly', included: true },
    { text: 'Submit rental applications', included: true },
    { text: 'Secure payment processing', included: true },
    { text: 'Digital rental agreements', included: true },
    { text: '5% cashback on caution fee', included: true },
    { text: 'Maintenance request system', included: true },
    { text: 'Priority support', included: true },
  ];

  const cautionFeeInfo = [
    {
      icon: Shield,
      title: 'Secure & Protected',
      description: 'Your caution fee is held securely and fully insured'
    },
    {
      icon: TrendingUp,
      title: '5% Annual Cashback',
      description: 'Your deposit grows while you rent - earn passive income'
    },
    {
      icon: CreditCard,
      title: '100% Refundable',
      description: 'Get your full deposit back plus cashback when you move out'
    }
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
              <Zap size={18} className="text-accent" />
              <span className="text-sm font-medium">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'Pricing'}
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
              {page?.subtitle || 'No hidden fees. No surprises. Just straightforward pricing for everyone.'}
            </p>
          </div>
        </div>
      </section>

      {/* Tenant Pricing */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Users size={24} />
                <span className="font-semibold uppercase tracking-wider text-sm">For Tenants</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                Completely Free to Find Your Home
              </h2>
              <p className="text-xl text-gray-600">
                No subscription fees. You only pay rent and a refundable caution fee.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border-2 border-green-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <span className="text-5xl md:text-6xl font-bold text-gray-900">FREE</span>
                  <p className="text-gray-600 mt-2">Forever free for tenants</p>
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

      {/* Landlord Pricing */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 text-primary mb-4">
              <Building2 size={24} />
              <span className="font-semibold uppercase tracking-wider text-sm">For Landlords</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              Start free, upgrade as you grow. All paid plans are billed annually.
            </p>
            {isLandlord && currentPlan && (
              <p className="text-sm text-gray-500">
                You're on the{' '}
                <span className="font-semibold text-primary">
                  {plans.find((p) => p.key === currentPlan)?.name || currentPlan}
                </span>{' '}
                plan.
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg inline-block px-4 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.key] || Building2;
              const isPopular = plan.key === POPULAR_PLAN;
              const isCurrent = plan.key === currentPlan;
              const isBusy = subscribingTo === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`relative bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col ${
                    isPopular ? 'ring-2 ring-accent' : ''
                  } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className={`p-8 flex flex-col flex-1 ${isPopular ? 'pt-14' : ''}`}>
                    <div className={`w-14 h-14 ${PLAN_ICON_BG[plan.key] || 'bg-gray-600'} rounded-2xl flex items-center justify-center mb-6`}>
                      <Icon className="text-white" size={28} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-6 min-h-[40px]">{plan.tagline}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{formatPrice(plan)}</span>
                      {plan.price > 0 && <span className="text-gray-600">/{plan.billing_period}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrent || isBusy}
                      className={`btn w-full mb-6 ${
                        isCurrent
                          ? 'bg-gray-100 text-gray-500 cursor-default'
                          : isPopular
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {isBusy ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="animate-spin" size={16} /> Redirecting…
                        </span>
                      ) : (
                        ctaLabel(plan)
                      )}
                    </button>

                    <ul className="space-y-3 mt-auto">
                      {plan.highlights.map((text, fIndex) => (
                        <li key={fIndex} className="flex items-start space-x-3">
                          <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                          <span className="text-gray-700">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CMS Content Section - Displays content from backend */}
      {page?.content && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto bg-gray-50 rounded-2xl p-6 md:p-10">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Questions About Pricing?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              We're here to help you understand our pricing structure
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary">
                Contact Us
              </Link>
              <Link to="/how-it-works" className="btn btn-secondary">
                Learn How It Works
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
            Join RentStay today - it's free for tenants!
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
