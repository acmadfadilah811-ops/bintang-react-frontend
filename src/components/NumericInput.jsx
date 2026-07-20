import { useState, useEffect, useRef } from 'react';

/**
 * Reusable numeric input component for easy number editing in React.
 * Solves common UX issues:
 * - Auto-selects text on focus so typing instantly replaces existing values (e.g. '0').
 * - Allows clearing the field completely (empty string) while typing without snapping back to 0.
 * - Prevents non-numeric letter keypresses.
 * - Supports integer or decimal numbers.
 */
export default function NumericInput({
  value,
  onChange,
  min,
  max,
  allowDecimal = false,
  placeholder = '0',
  className = '',
  disabled = false,
  onBlur: externalOnBlur,
  onFocus: externalOnFocus,
  ...props
}) {
  const inputRef = useRef(null);

  const formatInitial = (val) => {
    if (val === undefined || val === null || val === '') return '';
    return String(val);
  };

  const [localVal, setLocalVal] = useState(() => formatInitial(value));

  // Keep local state in sync when parent value changes, unless user is actively editing
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalVal(formatInitial(value));
    }
  }, [value]);

  const handleFocus = (e) => {
    // Select all text on focus so typing immediately overwrites the existing number
    e.target.select();
    if (externalOnFocus) externalOnFocus(e);
  };

  const handleChange = (e) => {
    const raw = e.target.value;

    // Filter characters
    let filtered = '';
    if (allowDecimal) {
      // Allow numbers and single decimal dot or comma (converted to dot)
      filtered = raw.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = filtered.split('.');
      if (parts.length > 2) {
        filtered = `${parts[0]}.${parts.slice(1).join('')}`;
      }
    } else {
      // Numbers only
      filtered = raw.replace(/[^0-9]/g, '');
    }

    setLocalVal(filtered);

    // Parse numeric value for parent callback
    if (filtered === '' || filtered === '.') {
      onChange(min !== undefined ? min : 0);
    } else {
      const parsed = allowDecimal ? parseFloat(filtered) : parseInt(filtered, 10);
      if (!isNaN(parsed)) {
        if (max !== undefined && parsed > max) {
          onChange(max);
        } else {
          onChange(parsed);
        }
      }
    }
  };

  const handleBlur = (e) => {
    if (localVal === '' || localVal === '.') {
      const fallback = min !== undefined ? min : 0;
      setLocalVal(String(fallback));
      onChange(fallback);
    } else {
      const parsed = allowDecimal ? parseFloat(localVal) : parseInt(localVal, 10);
      if (!isNaN(parsed)) {
        if (min !== undefined && parsed < min) {
          setLocalVal(String(min));
          onChange(min);
        } else if (max !== undefined && parsed > max) {
          setLocalVal(String(max));
          onChange(max);
        } else {
          setLocalVal(String(parsed));
        }
      }
    }
    if (externalOnBlur) externalOnBlur(e);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      {...props}
    />
  );
}
