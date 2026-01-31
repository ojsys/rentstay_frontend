import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Loader2, Search, MessageSquare, FileCheck, CreditCard,
  Key, Home, Building2, Users, Shield, TrendingUp,
  ArrowRight, CheckCircle, HelpCircle, ChevronRight
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
      color: 'bg-blue-500'
    },
    {
      icon: MessageSquare,
      title: 'Contact Landlord',
      description: 'Message landlords directly through our platform. Schedule viewings at your convenience.',
      color: 'bg-purple-500'
    },
    {
      icon: FileCheck,
      title: 'Submit Application',
      description: 'Apply for properties you love. Landlords review and respond to your application.',
      color: 'bg-green-500'
    },
    {
      icon: CreditCard,
      title: 'Secure Payment',
      description: 'Pay rent and caution fee securely via Paystack. Your caution fee earns 5% interest!',
      color: 'bg-amber-500'
    },
    {
      icon: FileCheck,
      title: 'Sign Agreement',
      description: 'Review and sign your rental agreement digitally. Both parties receive copies.',
      color: 'bg-indigo-500'
    },
    {
      icon: Key,
      title: 'Move In!',
      description: 'Collect your keys and enjoy your new home. Manage everything from your dashboard.',
      color: 'bg-primary'
    }
  ];

  const landlordSteps = [
    {
      icon: Users,
      title: 'Create Account',
      description: 'Register as a landlord and complete your profile verification.',
      color: 'bg-blue-500'
    },
    {
      icon: Home,
      title: 'List Property',
      description: 'Add your property details, upload photos, and set your rental price.',
      color: 'bg-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'Receive Inquiries',
      description: 'Get messages from interested tenants and schedule property viewings.',
      color: 'bg-green-500'
    },
    {
      icon: FileCheck,
      title: 'Review Applications',
      description: 'Evaluate tenant applications and approve the best candidates.',
      color: 'bg-amber-500'
    },
    {
      icon: CreditCard,
      title: 'Receive Payment',
      description: 'Rent payments are processed securely and deposited to your account.',
      color: 'bg-indigo-500'
    },
    {
      icon: Building2,
      title: 'Manage Property',
      description: 'Track payments, handle maintenance requests, and communicate with tenants.',
      color: 'bg-primary'
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

        <div className="container-custom relative z-10 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
              {page?.title || 'How It Works'}
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              {page?.subtitle || 'Finding your perfect home or tenant has never been easier'}
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setActiveTab('tenant')}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-medium transition-all text-sm md:text-base ${
                  activeTab === 'tenant'
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                I'm a Tenant
              </button>
              <button
                onClick={() => setActiveTab('landlord')}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-medium transition-all text-sm md:text-base ${
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

      {/* Steps Section - Timeline Design */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-3 md:mb-4">
              {activeTab === 'tenant' ? 'Your Journey to a New Home' : 'Start Earning from Your Property'}
            </h2>
            <p className="text-base md:text-xl text-dark-600 max-w-2xl mx-auto">
              {activeTab === 'tenant'
                ? 'Follow these simple steps to find and secure your perfect rental'
                : 'List your property and start receiving applications in minutes'}
            </p>
          </div>

          {/* Mobile Timeline (Vertical) */}
          <div className="md:hidden">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200"></div>

              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="relative flex items-start gap-4 pl-2">
                    {/* Step Number Circle */}
                    <div className={`relative z-10 w-10 h-10 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}>
                      {index + 1}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 ${step.color} rounded-lg flex items-center justify-center`}>
                          <step.icon className="text-white" size={20} />
                        </div>
                        <h3 className="font-bold text-dark-900">{step.title}</h3>
                      </div>
                      <p className="text-dark-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Timeline (Two Rows) */}
          <div className="hidden md:block">
            {/* First Row - Steps 1-3 */}
            <div className="relative mb-8">
              {/* Horizontal Line */}
              <div className="absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300"></div>

              <div className="grid grid-cols-3 gap-6">
                {steps.slice(0, 3).map((step, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    {/* Step Number */}
                    <div className={`relative z-10 w-14 h-14 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6`}>
                      {index + 1}
                    </div>

                    {/* Card */}
                    <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow w-full h-full">
                      <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <step.icon className="text-white" size={26} />
                      </div>
                      <h3 className="text-lg font-bold text-dark-900 mb-2">{step.title}</h3>
                      <p className="text-dark-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow Down Connector */}
            <div className="flex justify-center my-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <ChevronRight className="text-primary rotate-90" size={24} />
              </div>
            </div>

            {/* Second Row - Steps 4-6 */}
            <div className="relative mt-8">
              {/* Horizontal Line */}
              <div className="absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300"></div>

              <div className="grid grid-cols-3 gap-6">
                {steps.slice(3, 6).map((step, index) => (
                  <div key={index + 3} className="flex flex-col items-center text-center">
                    {/* Step Number */}
                    <div className={`relative z-10 w-14 h-14 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6`}>
                      {index + 4}
                    </div>

                    {/* Card */}
                    <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow w-full h-full">
                      <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <step.icon className="text-white" size={26} />
                      </div>
                      <h3 className="text-lg font-bold text-dark-900 mb-2">{step.title}</h3>
                      <p className="text-dark-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-10 md:mt-16">
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

      {/* CMS Content Section */}
      {page?.content && (
        <section className="py-12 md:py-16 bg-white border-t border-gray-100">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-slate prose-sm md:prose-base lg:prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-4">
              Why Choose RentStay?
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 md:p-8 shadow-soft text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <benefit.icon className="text-primary" size={24} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-dark-900 mb-1 md:mb-2">{benefit.title}</h3>
                <p className="text-dark-600 text-xs md:text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3 md:space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-dark-900 mb-2 flex items-start">
                    <CheckCircle className="text-primary mr-2 md:mr-3 flex-shrink-0 mt-0.5" size={18} />
                    {faq.question}
                  </h3>
                  <p className="text-dark-600 text-sm md:text-base ml-6 md:ml-8">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-6 md:mt-8">
              <p className="text-dark-600 mb-4">Still have questions?</p>
              <Link to="/contact" className="btn btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-4xl font-display font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of happy tenants and landlords on RentStay
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
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
