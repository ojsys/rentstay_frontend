import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Loader2, Search, MessageSquare, FileCheck, CreditCard,
  Key, Home, Building2, Users, Shield, TrendingUp,
  ArrowRight, CheckCircle, HelpCircle
} from 'lucide-react';

const HowItWorks = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tenant');

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await pagesAPI.getPage('how-it-works');
        setPage(response.data);
        document.title = `${response.data.title || 'How It Works'} | RentStay`;
      } catch (err) {
        console.error('Error fetching page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const tenantSteps = [
    {
      icon: Search,
      title: 'Search Properties',
      description: 'Browse our verified listings using filters for location, price, property type, and amenities.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: MessageSquare,
      title: 'Contact Landlord',
      description: 'Message landlords directly through our platform. Schedule viewings at your convenience.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FileCheck,
      title: 'Submit Application',
      description: 'Apply for properties you love. Landlords review and respond to your application.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: CreditCard,
      title: 'Secure Payment',
      description: 'Pay rent and caution fee securely via Paystack. Your caution fee earns 5% interest!',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: FileCheck,
      title: 'Sign Agreement',
      description: 'Review and sign your rental agreement digitally. Both parties receive copies.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Key,
      title: 'Move In!',
      description: 'Collect your keys and enjoy your new home. Manage everything from your dashboard.',
      color: 'from-primary to-primary-600'
    }
  ];

  const landlordSteps = [
    {
      icon: Users,
      title: 'Create Account',
      description: 'Register as a landlord and complete your profile verification.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Home,
      title: 'List Property',
      description: 'Add your property details, upload photos, and set your rental price.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: MessageSquare,
      title: 'Receive Inquiries',
      description: 'Get messages from interested tenants and schedule property viewings.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FileCheck,
      title: 'Review Applications',
      description: 'Evaluate tenant applications and approve the best candidates.',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: CreditCard,
      title: 'Receive Payment',
      description: 'Rent payments are processed securely and deposited to your account.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Building2,
      title: 'Manage Property',
      description: 'Track payments, handle maintenance requests, and communicate with tenants.',
      color: 'from-primary to-primary-600'
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'All properties are verified for authenticity'
    },
    {
      icon: TrendingUp,
      title: 'Earn Interest',
      description: '5% annual interest on caution fees'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Bank-grade security with Paystack'
    },
    {
      icon: FileCheck,
      title: 'Digital Agreements',
      description: 'Sign contracts online, no paperwork'
    }
  ];

  const faqs = [
    {
      question: 'How much is the caution fee?',
      answer: 'The caution fee is 10% of the annual rent. It\'s fully refundable and earns 5% annual interest while you rent.'
    },
    {
      question: 'How do I get my caution fee back?',
      answer: 'When your tenancy ends, the caution fee plus accrued interest is refunded within 30 days, minus any deductions for damages.'
    },
    {
      question: 'Are the properties verified?',
      answer: 'Yes, all properties on RentStay are verified. We ensure listings are accurate and landlords are legitimate.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfers, debit/credit cards, and USSD payments through our secure Paystack integration.'
    }
  ];

  const steps = activeTab === 'tenant' ? tenantSteps : landlordSteps;

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
      <section className="relative bg-gradient-to-br from-accent-500 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'How It Works'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              {page?.subtitle || 'Finding your perfect home or tenant has never been easier'}
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setActiveTab('tenant')}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === 'tenant'
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                I'm a Tenant
              </button>
              <button
                onClick={() => setActiveTab('landlord')}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === 'landlord'
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                I'm a Landlord
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
              {activeTab === 'tenant' ? 'Your Journey to a New Home' : 'Start Earning from Your Property'}
            </h2>
            <p className="text-xl text-dark-600">
              {activeTab === 'tenant'
                ? 'Follow these simple steps to find and secure your perfect rental'
                : 'List your property and start receiving applications in minutes'}
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 lg:relative lg:top-0 lg:left-0 lg:transform-none lg:mb-6 lg:flex lg:justify-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-lg font-bold shadow-lg z-10`}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-8 pt-12 lg:pt-8 text-center hover:shadow-lg transition-shadow h-full">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <step.icon className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-dark-900 mb-3">{step.title}</h3>
                    <p className="text-dark-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to={activeTab === 'tenant' ? '/properties' : '/register'}
              className="btn btn-primary btn-lg inline-flex items-center"
            >
              {activeTab === 'tenant' ? 'Start Searching' : 'List Your Property'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
              Why Choose RentStay?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-soft text-center">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="text-primary" size={28} />
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-2">{benefit.title}</h3>
                <p className="text-dark-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-2 flex items-start">
                    <CheckCircle className="text-primary mr-3 flex-shrink-0 mt-1" size={20} />
                    {faq.question}
                  </h3>
                  <p className="text-dark-600 ml-8">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-dark-600 mb-4">Still have questions?</p>
              <Link to="/contact" className="btn btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of happy tenants and landlords on RentStay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
              Browse Properties
            </Link>
            <Link to="/register" className="btn btn-lg bg-white/20 text-white border-2 border-white hover:bg-white/30">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
