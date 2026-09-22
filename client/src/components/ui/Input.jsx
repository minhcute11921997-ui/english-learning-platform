import { forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Input component tái sử dụng
 */
const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={clsx('input', error && 'border-danger-500 focus:ring-danger-500', className)}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
