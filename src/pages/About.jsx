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

  // Static data - these can be moved to backend later if needed
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Building2 size={18} />
              <span className="text-sm font-medium">360° Housing Solutions</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'About RentStay'}
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
              {page?.subtitle || 'Transforming rental housing in Nigeria through technology, transparency, and trust.'}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 md:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                <p className="text-2xl md:text-4xl font-bold text-primary mb-2">{stat.number}</p>
                <p className="text-sm md:text-base text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS Content Section - Displays content from backend */}
      {page?.content && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft p-6 md:p-10">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Target size={20} />
                <span className="font-semibold uppercase tracking-wider text-sm">Our Mission</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
                Making Housing Accessible for Everyone
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                We believe everyone deserves a safe, comfortable place to call home. RentStay is
                committed to eliminating the traditional barriers in Nigeria's rental market through
                innovative technology and transparent processes.
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-8 md:p-12">
                <div className="flex items-center space-x-3 mb-6">
                  <Eye size={24} className="text-primary" />
                  <h3 className="text-xl font-bold text-gray-900">Our Vision</h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become Nigeria's most trusted property rental platform, where finding
                  a home is as easy as a few clicks, and every transaction is secure,
                  transparent, and beneficial for all parties.
                </p>

                <div className="mt-8 space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at RentStay
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-lg transition-shadow text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Company Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
              Built by Experts, For Everyone
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our team combines decades of real estate experience with cutting-edge technology
              expertise. Based in Jos, Plateau State, we understand the local market and are
              committed to solving the housing challenges faced by Nigerians.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      <section className="py-16 bg-gradient-to-r from-primary to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
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
