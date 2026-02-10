const scoreColors = {
  low: { bar: 'bg-red-500', text: 'text-red-600', label: 'Needs Work' },
  medium: { bar: 'bg-amber-500', text: 'text-amber-600', label: 'Good' },
  high: { bar: 'bg-green-500', text: 'text-green-600', label: 'Excellent' },
};

const getLevel = (score) => {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const ListingQualityScore = ({ score = 0, tips = [] }) => {
  const level = getLevel(score);
  const colors = scoreColors[level];

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-dark-900">Listing Quality</h4>
        <span className={`text-lg font-bold ${colors.text}`}>{score}/100</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <p className={`text-xs font-medium ${colors.text} mb-3`}>{colors.label}</p>

      {/* Improvement tips */}
      {tips.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-dark-700">Tips to improve:</p>
          {tips.map((tip, i) => (
            <p key={i} className="text-xs text-dark-500 flex items-start gap-1">
              <span className="text-amber-500 mt-0.5">*</span>
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Calculate a quality score locally (mirrors backend logic).
 * Returns { score, tips }.
 */
export const calculateLocalQualityScore = (formData, imageCount = 0) => {
  let score = 0;
  const tips = [];

  // Title (10)
  if (formData.title && formData.title.length >= 10) score += 10;
  else tips.push('Add a descriptive title (at least 10 characters)');

  // Description (10)
  if (formData.description && formData.description.length >= 50) score += 10;
  else tips.push('Write a detailed description (at least 50 characters)');

  // Property type (5)
  if (formData.property_type) score += 5;

  // Address (5)
  if (formData.address) score += 5;
  else tips.push('Add the full address');

  // State & LGA (10)
  if (formData.state_id) score += 5;
  if (formData.lga_id) score += 5;

  // Area (5)
  if (formData.area) score += 5;

  // Photos (20)
  const photoScore = Math.min(imageCount * 5, 20);
  score += photoScore;
  if (imageCount < 4) tips.push(`Add ${4 - imageCount} more photos for a better listing`);

  // Details (15)
  if (formData.bedrooms != null) score += 3;
  if (formData.bathrooms != null) score += 3;
  if (formData.square_feet) score += 3;
  if (formData.rent_amount) score += 3;
  if (formData.rent_term) score += 3;

  // Amenities (10)
  const amenities = ['has_parking', 'has_kitchen', 'has_water', 'has_electricity', 'is_furnished', 'has_security'];
  const amenityCount = amenities.filter(a => formData[a]).length;
  score += Math.min(amenityCount * 2, 10);
  if (amenityCount < 3) tips.push('Select applicable amenities to attract tenants');

  // House rules (5)
  if (formData.house_rules && formData.house_rules.length >= 20) score += 5;
  else tips.push('Add house rules for clarity');

  // Coordinates (5)
  if (formData.latitude && formData.longitude) score += 5;

  return { score: Math.min(score, 100), tips };
};

export default ListingQualityScore;
