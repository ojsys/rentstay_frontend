import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;

const prettySize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * A single document/photo field for identity verification.
 *
 * Everything that used to make this step fail happens here instead of after a
 * failed submit: the file is checked for type and size on selection, an image
 * preview proves the right thing was picked, and on a phone the camera opens
 * directly rather than sending the user to a file browser for a document they
 * have not photographed yet.
 */
const DocumentUpload = ({
  label,
  hint,
  value,
  onChange,
  accept = 'image/jpeg,image/jpg,image/png,application/pdf',
  capture,          // 'environment' for the ID, 'user' for the selfie
  required = false,
  icon: Icon = FileText,
}) => {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  // Object URLs must be revoked or the page leaks them as files are swapped.
  useEffect(() => {
    if (!value || !value.type?.startsWith('image/')) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const accepts = (file) => {
    const allowed = accept.split(',').map(s => s.trim());
    return allowed.includes(file.type);
  };

  const take = (file) => {
    if (!file) return;
    if (!accepts(file)) {
      setError('That file type is not accepted. Use a JPG, PNG or PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${prettySize(file.size)}. Please keep it under 5 MB.`);
      return;
    }
    setError('');
    onChange(file);
  };

  const clear = () => {
    setError('');
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  return (
    <div>
      <label className="label flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3 flex items-center gap-3">
          {preview ? (
            <img src={preview} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-dark-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-900 truncate flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
              {value.name}
            </p>
            <p className="text-xs text-dark-500">{prettySize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-dark-400 hover:text-red-500 flex-shrink-0"
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files?.[0]);
          }}
          className={`border border-dashed rounded-xl p-4 transition ${
            dragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-dark-700 transition"
            >
              <Upload size={15} /> Choose file
            </button>
            {capture && (
              /* Phones open the camera straight away; desktops fall back to a
                 file picker, so this is safe to always render. */
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0C3B2E] hover:bg-[#0a3226] text-sm font-medium text-white transition"
              >
                <Camera size={15} /> Take photo
              </button>
            )}
          </div>
          <p className="text-[11px] text-dark-400 text-center mt-2">
            or drag a file here · JPG, PNG or PDF · max 5 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => take(e.target.files?.[0])}
      />
      {capture && (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture={capture}
          className="hidden"
          onChange={(e) => take(e.target.files?.[0])}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1.5 flex items-start gap-1">
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-dark-500 mt-1.5">{hint}</p>}
    </div>
  );
};

export default DocumentUpload;
