import { useEffect, useRef } from 'react';

// Lightweight CKEditor wrapper using CDN Classic build
// Props: value (string), onChange(newValue), disabled, className
const RichTextEditor = ({ value = '', onChange, disabled = false, className = '' }) => {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const lastValRef = useRef(value || '');

  useEffect(() => {
    let mounted = true;
    const el = hostRef.current;
    if (!el) return () => {};

    const boot = async () => {
      // Wait for CDN script to load ClassicEditor
      const waitForEditor = (tries = 0) => new Promise((resolve, reject) => {
        if (window.ClassicEditor) return resolve(window.ClassicEditor);
        if (tries > 100) return reject(new Error('CKEditor not loaded'));
        setTimeout(() => resolve(waitForEditor(tries + 1)), 50);
      });

      try {
        const ClassicEditor = await waitForEditor();
        if (!mounted) return;
        const instance = await ClassicEditor.create(el, { initialData: value || '' });
        editorRef.current = instance;
        lastValRef.current = value || '';
        if (disabled) instance.enableReadOnlyMode('rted');
        instance.model.document.on('change:data', () => {
          const data = instance.getData();
          lastValRef.current = data;
          if (onChange) onChange(data);
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to init CKEditor', e);
      }
    };

    boot();
    return () => {
      mounted = false;
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
    };
  }, []); // mount only

  // Keep value in sync when prop changes externally
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.getData();
    if ((value || '') !== current) {
      ed.setData(value || '');
      lastValRef.current = value || '';
    }
  }, [value]);

  return (
    <div className={`ck-editor-host ${className}`}>
      <div ref={hostRef} />
    </div>
  );
};

export default RichTextEditor;

