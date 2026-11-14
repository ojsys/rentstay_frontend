import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Copies the link that actually previews in a chat app.
 *
 * Deliberately **not** the address-bar URL. That points at the React app, and
 * social crawlers do not run JavaScript, so a link to it shares as a bare URL
 * with no picture no matter what the page sets. `url` should come from
 * `listingShareUrl` / `propertyShareUrl`, which point at the backend page that
 * renders the preview tags and then forwards the person to the same place.
 */
const ShareButton = ({ url, title, label = 'Share', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // Prefer the OS share sheet: on a phone that is what people expect, and it
    // hands the link straight to WhatsApp.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unsupported — fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1.5 text-sm text-dark-600 hover:text-dark-900 font-medium ${className}`}
    >
      {copied ? <Check size={15} className="text-green-600" /> : <Share2 size={15} />}
      {copied ? 'Link copied' : label}
    </button>
  );
};

export default ShareButton;
