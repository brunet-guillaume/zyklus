import { useRef, useEffect, useCallback } from 'react';

// ContentEditable text input component
export function ContentEditableInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (document.activeElement !== ref.current) {
        ref.current.textContent = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleDoubleClick = useCallback(() => {
    if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  return (
    <div className="auto-width-input text-xs">
      <span>{value || placeholder}</span>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onDoubleClick={handleDoubleClick}
        data-placeholder={placeholder}
        className={`input editable outline-none whitespace-pre ${className}`}
      />
    </div>
  );
}

// ContentEditable code editor component
export function ContentEditableCode({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (document.activeElement !== ref.current) {
        ref.current.textContent = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleDoubleClick = useCallback(() => {
    if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      onInput={handleInput}
      onDoubleClick={handleDoubleClick}
      data-placeholder={placeholder}
      className={`w-48 min-h-20 border-b text-xs font-mono whitespace-pre-wrap ${className}`}
    />
  );
}
