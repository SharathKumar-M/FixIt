import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, iconLeft, iconRight, required, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const wrapperClasses = [
      styles.inputWrapper,
      iconLeft ? styles.withIconLeft : '',
      iconRight ? styles.withIconRight : '',
      error ? styles.hasError : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`${styles.group} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={wrapperClasses}>
          {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
          <input ref={ref} id={inputId} className={styles.input} required={required} {...props} />
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </div>
        {error ? (
          <span className={styles.errorText}>{error}</span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, required, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`${styles.group} ${error ? styles.hasError : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${styles.input} ${styles.textarea}`}
          required={required}
          {...props}
        />
        {error ? (
          <span className={styles.errorText}>{error}</span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
