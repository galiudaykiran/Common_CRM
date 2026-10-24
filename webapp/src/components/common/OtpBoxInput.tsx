import React, { useRef, useEffect } from 'react';

interface OtpBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpBoxInput: React.FC<OtpBoxInputProps> = ({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of characters, padding with empty strings
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1); // take the last entered digit

    const newDigits = [...digits];
    newDigits[index] = digit;
    const combined = newDigits.join('');
    onChange(combined);

    // If a digit was entered, advance focus to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const targetIdx = Math.min(pastedData.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.6rem',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.5rem 0',
      }}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i]}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          style={{
            width: '48px',
            height: '52px',
            borderRadius: '10px',
            border: digits[i]
              ? '2px solid var(--accent-primary)'
              : '1.5px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            boxShadow: digits[i] ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
            transition: 'all 0.15s ease',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !digits[i]) {
              e.currentTarget.style.borderColor = 'var(--text-muted)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !digits[i]) {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }
          }}
        />
      ))}
    </div>
  );
};
