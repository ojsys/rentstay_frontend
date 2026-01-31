import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI, siteSettingsAPI } from '../services/api';
import { Mail, Phone, MapPin, Send, Loader2, Clock, MessageCircle, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const [page, setPage] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both page content and site settings in parallel
        const [pageResponse, settingsResponse] = await Promise.all([
          pagesAPI.getPage('contact').catch(() => null),
          siteSettingsAPI.get().catch(() => null),
        ]);

        if (pageResponse?.data) {
          setPage(pageResponse.data);
          document.title = `${pageResponse.data.title || 'Contact Us'} | RentStay`;
        } else {
          setPage({
            title: 'Contact Us',
            subtitle: "We'd love to hear from you",
          });
        }

        if (settingsResponse?.data) {
          setSiteSettings(settingsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching contact data:', err);
        setPage({
          title: 'Contact Us',
          subtitle: "We'd love to hear from you",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  // Dynamic contact methods from site settings
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email anytime',
      value: siteSettings?.contact_email || 'support@myrentstay.com',
      href: `mailto:${siteSettings?.contact_email || 'support@myrentstay.com'}`,
      color: 'bg-blue-500'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: `Mon-Fri ${siteSettings?.office_hours_weekday || '8am to 6pm'}`,
      value: siteSettings?.contact_phone || '+234-XXX-XXX-XXXX',
      href: `tel:${siteSettings?.contact_phone?.replace(/[^+\d]/g, '') || ''}`,
      color: 'bg-green-500'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Come say hello',
      value: siteSettings?.contact_address || 'Jos, Plateau State, Nigeria',
      href: siteSettings?.contact_address
        ? `https://maps.google.com/?q=${encodeURIComponent(siteSettings.contact_address)}`
        : '#',
      color: 'bg-purple-500'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our team',
      value: 'Start a conversation',
      href: siteSettings?.whatsapp_number
        ? `https://wa.me/${siteSettings.whatsapp_number.replace(/[^+\d]/g, '')}`
        : '#',
      color: 'bg-amber-500'
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
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-gray-900 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Headphones size={18} className="text-accent" />
              <span className="text-sm font-medium">We're Here to Help</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page?.title || 'Contact Us'}
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
              {page?.subtitle || "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="group bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 ${method.color} rounded-xl flex items-center justify-center mb-4`}>
                  <method.icon className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{method.description}</p>
                <p className="text-primary font-medium">{method.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
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

              {/* Right Sidebar */}
              <div className="lg:col-span-2 space-y-8">
                {/* Office Hours */}
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="text-primary" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Office Hours</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-medium">{siteSettings?.office_hours_weekday || '8:00 AM - 6:00 PM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-medium">{siteSettings?.office_hours_saturday || '9:00 AM - 2:00 PM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className={`font-medium ${siteSettings?.office_hours_sunday === 'Closed' || !siteSettings?.office_hours_sunday ? 'text-gray-500' : ''}`}>
                        {siteSettings?.office_hours_sunday || 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CMS Content - Displays content from backend */}
                {page?.content && (
                  <div className="bg-white rounded-2xl p-6 shadow-soft">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                  </div>
                )}

                {/* Quick Links */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    <Link to="/how-it-works" className="block text-primary hover:underline">
                      How It Works →
                    </Link>
                    <Link to="/pricing" className="block text-primary hover:underline">
                      View Pricing →
                    </Link>
                    <Link to="/properties" className="block text-primary hover:underline">
                      Browse Properties →
                    </Link>
                  </div>
                </div>
              </div>
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
