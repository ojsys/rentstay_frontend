import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import useSiteSettings from '../../hooks/useSiteSettings';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();

  // Check if any social links are available
  const hasSocialLinks = settings?.facebook_url || settings?.twitter_url ||
                         settings?.instagram_url || settings?.linkedin_url;

  return (
    <footer className="bg-dark-800 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {settings?.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={settings?.site_name || 'RentStay'}
                  className="h-10 w-auto"
                />
              ) : (
                <>
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <span className="text-2xl font-display font-bold text-white">
                    Rent<span className="text-accent">Stay</span>
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {settings?.site_description || '360° Housing Solutions. Transforming rental housing in Nigeria through technology, transparency, and trust.'}
            </p>
            {hasSocialLinks && (
              <div className="flex space-x-3">
                {settings?.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-dark-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Facebook size={16} />
                  </a>
                )}
                {settings?.twitter_url && (
                  <a
                    href={settings.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-dark-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-dark-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {settings?.linkedin_url && (
                  <a
                    href={settings.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-dark-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Linkedin size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-primary transition-colors">Browse Properties</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">List Your Property</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Landlords</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {(settings?.contact_address || !settings) && (
                <li className="flex items-start space-x-2">
                  <MapPin size={16} className="mt-1 flex-shrink-0 text-primary" />
                  <span>{settings?.contact_address || 'Jos, Plateau State, Nigeria'}</span>
                </li>
              )}
              {(settings?.contact_phone || !settings) && (
                <li className="flex items-center space-x-2">
                  <Phone size={16} className="flex-shrink-0 text-primary" />
                  <a
                    href={`tel:${settings?.contact_phone?.replace(/[^+\d]/g, '') || ''}`}
                    className="hover:text-primary transition-colors"
                  >
                    {settings?.contact_phone || '+234-901-517-0830'}
                  </a>
                </li>
              )}
              {(settings?.contact_email || !settings) && (
                <li className="flex items-center space-x-2">
                  <Mail size={16} className="flex-shrink-0 text-primary" />
                  <a
                    href={`mailto:${settings?.contact_email || 'info@myrentstay.com'}`}
                    className="hover:text-primary transition-colors"
                  >
                    {settings?.contact_email || 'info@myrentstay.com'}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; {currentYear} {settings?.site_name || 'RentStay'}. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
