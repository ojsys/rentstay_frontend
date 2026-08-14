/**
 * The site name rendered as a two-tone wordmark beside the logo.
 *
 * The brand look colours the trailing word differently ("Rent" + "Stay"), so
 * the name is split rather than hardcoded — an admin renaming the site in
 * SiteSettings gets a sensible wordmark without a code change.
 *
 * Splitting rules, most specific first:
 *   "Rent Stay"  → Rent | Stay   (last space)
 *   "RentStay"   → Rent | Stay   (last inner capital, CamelCase)
 *   "Rentstay"   → Rentstay |    (nothing to split on — render as one tone)
 */
const splitSiteName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return ['Rent', 'Stay'];

  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) {
    return [trimmed.slice(0, lastSpace + 1), trimmed.slice(lastSpace + 1)];
  }

  // Last capital that isn't the first character, e.g. RentStay → Rent | Stay
  const match = trimmed.match(/^(.*[a-z])([A-Z][a-z]*)$/);
  if (match) return [match[1], match[2]];

  return [trimmed, ''];
};

/**
 * @param siteName   raw SiteSettings.site_name
 * @param className  colour/size of the leading portion
 * @param accentClassName  colour of the trailing portion
 */
const BrandTitle = ({
  siteName,
  className = 'text-2xl font-display font-bold text-primary',
  accentClassName = 'text-accent',
}) => {
  const [head, tail] = splitSiteName(siteName);
  return (
    <span className={className}>
      {head}
      {tail && <span className={accentClassName}>{tail}</span>}
    </span>
  );
};

export default BrandTitle;
