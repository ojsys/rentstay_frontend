import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import {
  Mail, Phone, MapPin, Send, Loader2, Clock, MessageCircle,
  HelpCircle, Building2, Users, FileText, Headphones, ArrowRight,
  Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    userType: 'tenant',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await pagesAPI.getPage('contact');
        setPage(response.data);
        document.title = `${response.data.title || 'Contact Us'} | RentStay`;
      } catch (err) {
        console.error('Error fetching contact page:', err);
        setPage({
          title: 'Contact Us',
          subtitle: "We'd love to hear from you",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission (replace with actual API call when backend is ready)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', userType: 'tenant', message: '' });
    setSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email anytime',
      value: 'support@myrentstay.com',
      href: 'mailto:support@myrentstay.com',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri from 8am to 6pm',
      value: '+234-XXX-XXX-XXXX',
      href: 'tel:+234XXXXXXXXXX',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Come say hello',
      value: 'Jos, Plateau State, Nigeria',
      href: '#',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our team',
      value: 'Start a conversation',
      href: '#',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const supportTopics = [
    {
      icon: Building2,
      title: 'Property Listings',
      description: 'Questions about listing or finding properties'
    },
    {
      icon: FileText,
      title: 'Rental Agreements',
      description: 'Help with contracts and legal documents'
    },
    {
      icon: Users,
      title: 'Account Issues',
      description: 'Login, verification, and profile help'
    },
    {
      icon: HelpCircle,
      title: 'General Inquiries',
      description: 'Other questions and feedback'
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
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
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Headphones size={18} className="text-accent" />
              <span className="text-sm font-medium">We're Here to Help</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'Contact Us'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {page?.subtitle || "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
            </p>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white -mt-1">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="group bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <method.icon className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-dark-900 mb-1">{method.title}</h3>
                <p className="text-dark-500 text-sm mb-2">{method.description}</p>
                <p className="text-primary font-medium">{method.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Contact Form - Takes 3 columns */}
              <div className="lg:col-span-3">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-dark-600 mb-8">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-dark-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-dark-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="+234-XXX-XXX-XXXX"
                        />
                      </div>

                      <div>
                        <label htmlFor="userType" className="block text-sm font-medium text-dark-700 mb-2">
                          I am a *
                        </label>
                        <select
                          id="userType"
                          name="userType"
                          value={formData.userType}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          <option value="tenant">Tenant</option>
                          <option value="landlord">Landlord</option>
                          <option value="agent">Agent</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-dark-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-dark-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg w-full md:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-8">
                {/* Support Topics */}
                <div>
                  <h3 className="text-xl font-bold text-dark-900 mb-6">Common Support Topics</h3>
                  <div className="space-y-4">
                    {supportTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <topic.icon className="text-primary" size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-900">{topic.title}</h4>
                          <p className="text-dark-600 text-sm">{topic.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Office Hours */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="text-primary" size={24} />
                    <h3 className="text-xl font-bold text-dark-900">Office Hours</h3>
                  </div>
                  <div className="space-y-3 text-dark-700">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-medium">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-medium">9:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="font-medium text-dark-500">Closed</span>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-xl font-bold text-dark-900 mb-4">Follow Us</h3>
                  <div className="flex space-x-3">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        aria-label={social.label}
                        className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-dark-600 hover:bg-primary hover:text-white transition-all"
                      >
                        <social.icon size={22} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* CMS Content */}
                {page?.content && (
                  <div
                    className="prose prose-sm max-w-none text-dark-600"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-4">
              Looking for Answers?
            </h2>
            <p className="text-xl text-dark-600 mb-8">
              Check out our FAQ section or learn more about how RentStay works.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/how-it-works" className="btn btn-primary inline-flex items-center">
                How It Works
                <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link to="/pricing" className="btn btn-secondary">
                View Pricing
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
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of happy tenants and landlords on RentStay today.
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

export default Contact;
