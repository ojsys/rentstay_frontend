import { useState, useRef } from 'react';
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react';

const QUALITY_TIPS = [
  'Use natural lighting when possible',
  'Capture rooms from corners for a wider view',
  'Include photos of all key rooms and amenities',
  'Add at least 4 photos for better engagement',
  'Show the exterior and entrance of the property',
];

const PhotoUploadStep = ({ images = [], onImagesChange, maxImages = 10 }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const validFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, maxImages - images.length);

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      is_primary: images.length === 0 && i === 0,
    }));

    onImagesChange?.([...images, ...newImages]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx) => {
    const updated = images.filter((_, i) => i !== idx);
    // Ensure at least one is primary
    if (updated.length > 0 && !updated.some(img => img.is_primary)) {
      updated[0].is_primary = true;
    }
    onImagesChange?.(updated);
  };

  const handleSetPrimary = (idx) => {
    const updated = images.map((img, i) => ({ ...img, is_primary: i === idx }));
    onImagesChange?.(updated);
  };

  return (
    <div className="space-y-4">
      {/* Quality tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Photo Tips</h4>
        <ul className="space-y-1">
          {QUALITY_TIPS.map((tip, i) => (
            <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
              <span className="mt-0.5">*</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-dark-700 font-medium">
          Drop images here or click to upload
        </p>
        <p className="text-xs text-dark-500 mt-1">
          {images.length}/{maxImages} photos uploaded
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={img.id || idx} className="relative group rounded-lg overflow-hidden border">
              <img
                src={img.preview || img.image || img.image_url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-32 object-cover"
              />
              {/* Primary badge */}
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-primary text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5">
                  <Star size={10} /> Primary
                </span>
              )}
              {/* Action overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetPrimary(idx); }}
                    className="bg-white text-dark-700 p-1.5 rounded-full text-xs hover:bg-gray-100"
                    title="Set as primary"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                  className="bg-white text-red-600 p-1.5 rounded-full text-xs hover:bg-red-50"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-dark-500 text-sm">
          <ImageIcon size={16} />
          <span>No photos added yet. Add at least 1 photo to publish your listing.</span>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadStep;
