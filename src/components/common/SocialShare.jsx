import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp, FaFacebookF, FaXTwitter, FaLinkedinIn, FaTelegram } from 'react-icons/fa6';
import { Mail, Link2, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Social share buttons for a property or stay listing.
 *
 * `url` must be the **backend** share URL (`propertyShareUrl` /
 * `listingShareUrl`), never the address bar: crawlers don't run JavaScript, so
 * only the server-rendered /s/… page gives Facebook or WhatsApp a picture and a
 * title. That page forwards people on to the app.
 *
 * Two layouts share one set of networks:
 *  - <ShareLinks>  an inline "Share this" row inside the page.
 *  - <FloatingShare> a vertical rail in the left margin (wide screens) or a
 *    slim bar along the bottom (everything narrower). It steps aside while the inline row is on screen,
 *    so the same icons are never shown twice.
 */

const NETWORKS = [
  {
    key: 'whatsapp', label: 'WhatsApp', Icon: FaWhatsapp, color: '#25D366',
    href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
  },
  {
    key: 'facebook', label: 'Facebook', Icon: FaFacebookF, color: '#1877F2',
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    key: 'x', label: 'X (Twitter)', Icon: FaXTwitter, color: '#000000',
    href: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedinIn, color: '#0A66C2',
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    key: 'telegram', label: 'Telegram', Icon: FaTelegram, color: '#26A5E4',
    href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    key: 'email', label: 'Email', Icon: Mail, color: '#475569',
    href: (u, t) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(`${t}\n\n${u}`)}`,
  },
];

const canNativeShare = () => typeof navigator !== 'undefined' && !!navigator.share;

function useCopy(url) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };
  return [copied, copy];
}

async function nativeShare(url, text) {
  try {
    await navigator.share({ title: text, url });
  } catch {
    // Cancelled by the person; nothing to do.
  }
}

/** One round brand-coloured button. */
const NetworkButton = ({ network, url, text, size }) => {
  const { Icon, label, color, href, key } = network;
  return (
    <a
      href={href(url, text)}
      target={key === 'email' ? undefined : '_blank'}
      rel="noopener noreferrer"
      aria-label={`Share on ${label}`}
      title={`Share on ${label}`}
      style={{ backgroundColor: color }}
      className={`inline-flex items-center justify-center rounded-full text-white shadow-sm
        transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-primary ${size}`}
    >
      <Icon size={size === 'w-9 h-9' ? 16 : 18} />
    </a>
  );
};

const CopyButton = ({ url, size, className = '' }) => {
  const [copied, copy] = useCopy(url);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Link copied' : 'Copy link'}
      title={copied ? 'Link copied' : 'Copy link'}
      className={`inline-flex items-center justify-center rounded-full shadow-sm transition-transform
        hover:scale-110 ${copied ? 'bg-green-600 text-white' : 'bg-gray-200 text-dark-700'} ${size} ${className}`}
    >
      {copied ? <Check size={17} /> : <Link2 size={17} />}
    </button>
  );
};

/** Inline "Share this …" row, placed inside the page body. */
export const ShareLinks = ({ url, text, heading = 'Share this', className = '', onVisibleChange }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!onVisibleChange || !ref.current || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => onVisibleChange(entry.isIntersecting));
    io.observe(ref.current);
    return () => io.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={ref} className={className}>
      <h3 className="text-sm font-semibold text-dark-900 mb-3">{heading}</h3>
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {NETWORKS.map((n) => (
          <NetworkButton key={n.key} network={n} url={url} text={text} size="w-9 h-9 sm:w-10 sm:h-10" />
        ))}
        <CopyButton url={url} size="w-9 h-9 sm:w-10 sm:h-10" />
        {canNativeShare() && (
          <button
            type="button"
            onClick={() => nativeShare(url, text)}
            aria-label="More sharing options"
            title="More options"
            className="inline-flex items-center justify-center rounded-full bg-gray-200 text-dark-700 shadow-sm w-9 h-9 sm:w-10 sm:h-10 hover:scale-110 transition-transform"
          >
            <Share2 size={17} />
          </button>
        )}
      </div>
    </div>
  );
};

/** Fixed side rail (lg+) / bottom bar (phones). */
export const FloatingShare = ({ url, text, hidden = false }) => {
  const mobile = NETWORKS.filter((n) => ['whatsapp', 'facebook', 'x', 'telegram'].includes(n.key));

  return (
    <>
      {/* Wide screens: vertical rail in the left margin, vertically centred.
          Only from 1360px, where the 1280px content column leaves room for it. */}
      <aside
        aria-label="Share"
        className={`hidden min-[1360px]:flex fixed left-3 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2
          bg-white/90 backdrop-blur border border-gray-200 rounded-full py-3 px-1.5 shadow-soft
          transition-all duration-300 ${hidden ? 'opacity-0 -translate-x-16 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-dark-500 mb-0.5">Share</span>
        {NETWORKS.map((n) => (
          <NetworkButton key={n.key} network={n} url={url} text={text} size="w-9 h-9" />
        ))}
        <CopyButton url={url} size="w-9 h-9" />
      </aside>

      {/* Narrower screens: slim bar along the bottom. */}
      <div
        aria-label="Share"
        className={`min-[1360px]:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200
          pb-[env(safe-area-inset-bottom)] transition-transform duration-300
          ${hidden ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}
      >
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          <span className="text-xs font-semibold text-dark-600 mr-1">Share</span>
          {mobile.map((n) => (
            <NetworkButton key={n.key} network={n} url={url} text={text} size="w-9 h-9" />
          ))}
          <CopyButton url={url} size="w-9 h-9" />
          {canNativeShare() && (
            <button
              type="button"
              onClick={() => nativeShare(url, text)}
              aria-label="More sharing options"
              className="inline-flex items-center justify-center rounded-full bg-gray-200 text-dark-700 w-9 h-9"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>
      {/* Room at the bottom of the page so the bar never covers the footer. */}
      <div className="min-[1360px]:hidden h-14" aria-hidden="true" />
    </>
  );
};

