import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Loader2, Shield, Users, TrendingUp, Award,
  CheckCircle, Building2, Heart, Target, Eye
} from 'lucide-react';

const About = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await pagesAPI.getPage('about');
        setPage(response.data);
        document.title = `${response.data.title || 'About Us'} | RentStay`;
      } catch (err) {
        console.error('Error fetching about page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const values = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'No hidden fees, no surprises. What you see is what you get.'
    },
    {
      icon: Heart,
      title: 'Trust',
      description: 'Building lasting relationships between landlords and tenants.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Using technology to simplify the rental experience.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Creating a supportive ecosystem for all stakeholders.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Properties Listed' },
    { number: '1,000+', label: 'Happy Tenants' },
    { number: '₦50M+', label: 'Caution Fees Managed' },
    { number: '98%', label: 'Satisfaction Rate' }
  ];

  const features = [
    'Verified property listings',
    'Transparent pricing with no hidden fees',
    '5% interest on caution fees',
    'Digital rental agreements',
    'Direct landlord communication',
    'Secure payment processing'
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
      {/* Hero Section - Fixed height issues */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10 py-16 md:py-24 lg:py-28">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 md:mb-6">
              <Building2 size={18} />
              <span className="text-sm font-medium">360° Housing Solutions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6 leading-tight">
              {page?.title || 'About RentStay'}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {page?.subtitle || 'Transforming rental housing in Nigeria through technology, transparency, and trust.'}
            </p>
          </div>
        </div>

        {/* Wave divider - positioned properly */}
        <div className="relative h-16 md:h-20">
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-full"
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 md:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">{stat.number}</p>
                <p className="text-xs sm:text-sm md:text-base text-dark-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            <div>
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Target size={20} />
                <span className="font-semibold uppercase tracking-wider text-sm">Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4 md:mb-6">
                Making Housing Accessible for Everyone
              </h2>
              {page?.content && (
                <div
                  className="prose prose-slate prose-sm md:prose-base lg:prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              )}
            </div>

            <div className="relative mt-4 lg:mt-0">
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
                <div className="flex items-center space-x-3 mb-4 md:mb-6">
                  <Eye size={22} className="text-primary" />
                  <h3 className="text-lg md:text-xl font-bold text-dark-900">Our Vision</h3>
                </div>
                <p className="text-dark-700 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                  To become Nigeria's most trusted property rental platform, where finding
                  a home is as easy as a few clicks, and every transaction is secure,
                  transparent, and beneficial for all parties.
                </p>

                <div className="space-y-2 md:space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                      <span className="text-dark-700 text-sm md:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-dark-900 mb-3 md:mb-4">
              Our Core Values
            </h2>
            <p className="text-base md:text-xl text-dark-600 max-w-2xl mx-auto">
              The principles that guide everything we do at RentStay
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-soft hover:shadow-lg transition-shadow text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <value.icon className="text-primary" size={28} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-dark-900 mb-2 md:mb-3">{value.title}</h3>
                <p className="text-dark-600 text-sm md:text-base">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Company Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center px-4">
            <Award className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4 md:mb-6">
              Built by Experts, For Everyone
            </h2>
            <p className="text-base md:text-xl text-dark-600 mb-6 md:mb-8 leading-relaxed">
              Our team combines decades of real estate experience with cutting-edge technology
              expertise. Based in Jos, Plateau State, we understand the local market and are
              committed to solving the housing challenges faced by Nigerians.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary btn-lg">
                Get in Touch
              </Link>
              <Link to="/properties" className="btn btn-secondary btn-lg">
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-primary-700 text-white">
        <div className="container-custom text-center px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 md:mb-4">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied tenants and landlords on RentStay
          </p>
          <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
