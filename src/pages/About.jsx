import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aboutAPI } from '../services/api';
import {
  Loader2, Shield, Users, TrendingUp, Building2, Briefcase, Sparkles,
  CheckCircle, Target, Eye, Cpu, Layers, Handshake, Linkedin, ArrowRight, Quote,
} from 'lucide-react';

// Icon rotations for the repeatable, admin-managed lists.
const GROUP_ICONS = [Building2, Users, Briefcase, Sparkles];
const FEATURE_ICONS = [Shield, TrendingUp, Layers, Eye, Handshake, Building2];
const VALUE_ICONS = [Cpu, Shield, Handshake, TrendingUp, Users];

const paras = (t) => (t || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
const lines = (t) => (t || '').split('\n').map((s) => s.trim()).filter(Boolean);
const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const About = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await aboutAPI.get();
        setData(res.data);
        document.title = `${res.data.hero_title || 'About Us'} | RentStay`;
      } catch (err) {
        console.error('Error fetching about page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const a = data || {};
  const groups = a.service_groups || [];
  const features = a.features || [];
  const values = a.values || [];
  const team = a.team_members || [];
  const goals = lines(a.story_goals);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            {a.hero_eyebrow && (
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Building2 size={18} />
                <span className="text-sm font-medium">{a.hero_eyebrow}</span>
              </div>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {a.hero_title || 'About RentStay'}
            </h1>
            {a.hero_subtitle && (
              <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto italic">
                {a.hero_subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Intro */}
      {paras(a.intro).length > 0 && (
        <section className="py-14 md:py-20 bg-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto space-y-5 text-center">
              {paras(a.intro).map((p, i) => (
                <p key={i} className="text-lg md:text-xl text-gray-600 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft">
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Target size={22} />
                <span className="font-semibold uppercase tracking-wider text-sm">{a.mission_heading || 'Our Mission'}</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">{a.mission_text}</p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-8 md:p-10">
              <div className="inline-flex items-center space-x-2 text-primary mb-4">
                <Eye size={22} />
                <span className="font-semibold uppercase tracking-wider text-sm">{a.vision_heading || 'Our Vision'}</span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">{a.vision_text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      {groups.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                {a.what_we_do_heading || 'What We Do'}
              </h2>
              {a.what_we_do_subtitle && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{a.what_we_do_subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {groups.map((g, i) => {
                const Icon = GROUP_ICONS[i % GROUP_ICONS.length];
                return (
                  <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-soft transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="text-primary" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{g.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {(g.bullets || []).map((b, bi) => (
                        <li key={bi} className="flex items-start gap-3">
                          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                          <span className="text-gray-700">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why RentStay */}
      {features.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                {a.why_heading || 'Why RentStay?'}
              </h2>
              {a.why_subtitle && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{a.why_subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <div key={i} className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-5">
                      <Icon className="text-primary" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-600">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Our Story */}
      {(paras(a.story_text).length > 0 || goals.length > 0) && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-8 text-center">
                {a.story_heading || 'Our Story'}
              </h2>
              <div className="space-y-5">
                {paras(a.story_text).map((p, i) => (
                  <p key={i} className="text-lg text-gray-600 leading-relaxed">{p}</p>
                ))}
              </div>
              {goals.length > 0 && (
                <div className="mt-8 bg-primary-50 rounded-2xl p-6 md:p-8 space-y-3">
                  {goals.map((g, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ArrowRight className="text-primary flex-shrink-0 mt-1" size={20} />
                      <p className="text-lg font-medium text-gray-800">{g}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Core Values */}
      {values.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                {a.values_heading || 'Our Core Values'}
              </h2>
              {a.values_subtitle && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{a.values_subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {values.map((v, i) => {
                const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-soft text-center">
                    <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="text-accent" size={26} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                    <p className="text-gray-600 text-sm">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Team — faces to build trust */}
      {team.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                {a.team_heading || 'The People Behind RentStay'}
              </h2>
              {a.team_subtitle && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{a.team_subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {team.map((m, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4">
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="w-full h-full object-cover rounded-2xl shadow-soft"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-3xl font-bold text-primary shadow-soft">
                        {initials(m.name)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                  <p className="text-primary font-medium text-sm">{m.role}</p>
                  {m.bio && <p className="text-gray-500 text-sm mt-2">{m.bio}</p>}
                  {m.linkedin_url && (
                    <a
                      href={m.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 mt-3 rounded-full bg-gray-100 text-gray-500 hover:bg-primary hover:text-white transition-colors"
                      aria-label={`${m.name} on LinkedIn`}
                    >
                      <Linkedin size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing band */}
      {(a.closing_heading || a.closing_text) && (
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="w-10 h-10 text-primary/40 mx-auto mb-5" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
                {a.closing_heading}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">{a.closing_text}</p>
            </div>
          </div>
        </section>
      )}

      {/* Brand tagline */}
      {(a.footer_tagline || a.footer_subtitle) && (
        <section className="py-12 bg-dark-900 text-white">
          <div className="container-custom text-center">
            <p className="text-2xl md:text-3xl font-display font-bold mb-2">RentStay</p>
            {a.footer_tagline && (
              <p className="text-lg text-accent font-semibold tracking-wide">{a.footer_tagline}</p>
            )}
            {a.footer_subtitle && (
              <p className="text-white/70 mt-2 italic">{a.footer_subtitle}</p>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            {a.cta_heading || 'Ready to Get Started?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{a.cta_text}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
              Get Started Today
            </Link>
            <Link to="/contact" className="btn btn-lg bg-white/20 hover:bg-white/30 text-white border-2 border-white">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
