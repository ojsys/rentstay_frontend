import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Loader2, Check, X, TrendingUp, Shield, CreditCard,
  Users, Building2, Star, Zap, Crown, HelpCircle
} from 'lucide-react';

const Pricing = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('annual');

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
    { text: 'Browse all verified listings', included: true },
    { text: 'Contact landlords directly', included: true },
    { text: 'Submit rental applications', included: true },
    { text: 'Secure payment processing', included: true },
    { text: 'Digital rental agreements', included: true },
    { text: '5% interest on caution fee', included: true },
    { text: 'Maintenance request system', included: true },
    { text: 'Priority support', included: true },
  ];

  const landlordPlans = [
    {
      name: 'Starter',
      icon: Building2,
      price: 'Free',
      description: 'Perfect for individual landlords getting started',
      features: [
        { text: 'List up to 3 properties', included: true },
        { text: 'Basic property analytics', included: true },
        { text: 'Tenant messaging', included: true },
        { text: 'Application management', included: true },
        { text: 'Payment collection', included: true },
        { text: 'Featured listings', included: false },
        { text: 'Priority placement', included: false },
        { text: 'Dedicated support', included: false },
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      name: 'Professional',
      icon: Star,
      price: billingCycle === 'annual' ? '₦15,000' : '₦1,500',
      period: billingCycle === 'annual' ? '/year' : '/month',
      description: 'For growing property portfolios',
      features: [
        { text: 'List up to 15 properties', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Tenant messaging', included: true },
        { text: 'Application management', included: true },
        { text: 'Payment collection', included: true },
        { text: '3 featured listings/month', included: true },
        { text: 'Priority placement', included: true },
        { text: 'Email support', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-primary to-primary-600'
    },
    {
      name: 'Enterprise',
      icon: Crown,
      price: billingCycle === 'annual' ? '₦50,000' : '₦5,000',
      period: billingCycle === 'annual' ? '/year' : '/month',
      description: 'For property management companies',
      features: [
        { text: 'Unlimited properties', included: true },
        { text: 'Full analytics suite', included: true },
        { text: 'Tenant messaging', included: true },
        { text: 'Bulk application management', included: true },
        { text: 'Payment collection + reports', included: true },
        { text: 'Unlimited featured listings', included: true },
        { text: 'Top priority placement', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'from-accent to-accent-600'
    },
  ];

  const cautionFeeInfo = [
    {
      icon: Shield,
      title: 'Secure & Protected',
      description: 'Your caution fee is held securely and fully insured'
    },
    {
      icon: TrendingUp,
      title: '5% Annual Interest',
      description: 'Your deposit grows while you rent - earn passive income'
    },
    {
      icon: CreditCard,
      title: '100% Refundable',
      description: 'Get your full deposit back plus interest when you move out'
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
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-dark-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Zap size={18} className="text-accent" />
              <span className="text-sm font-medium">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'Pricing'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
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
              <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
                Completely Free to Find Your Home
              </h2>
              <p className="text-xl text-dark-600">
                No subscription fees. You only pay rent and a refundable caution fee.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border-2 border-green-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <span className="text-5xl md:text-6xl font-bold text-dark-900">FREE</span>
                  <p className="text-dark-600 mt-2">Forever free for tenants</p>
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
                    <span className="text-dark-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution Fee Explanation */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-dark-900 text-center mb-8">
                About the Caution Fee
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cautionFeeInfo.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="text-primary" size={28} />
                    </div>
                    <h4 className="font-bold text-dark-900 mb-2">{item.title}</h4>
                    <p className="text-dark-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-dark-600 mt-6">
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-dark-600 mb-8">
              Start free, upgrade as you grow
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex bg-white rounded-full p-1 shadow-soft">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white'
                    : 'text-dark-600 hover:text-dark-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-primary text-white'
                    : 'text-dark-600 hover:text-dark-900'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {landlordPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl shadow-soft overflow-hidden ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <plan.icon className="text-white" size={28} />
                  </div>

                  <h3 className="text-2xl font-bold text-dark-900 mb-2">{plan.name}</h3>
                  <p className="text-dark-600 text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-dark-900">{plan.price}</span>
                    {plan.period && <span className="text-dark-600">{plan.period}</span>}
                  </div>

                  <Link
                    to="/register"
                    className={`btn w-full mb-6 ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        ) : (
                          <X className="text-gray-300 flex-shrink-0 mt-0.5" size={18} />
                        )}
                        <span className={feature.included ? 'text-dark-700' : 'text-dark-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-display font-bold text-dark-900 mb-4">
              Questions About Pricing?
            </h2>
            <p className="text-xl text-dark-600 mb-8">
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
