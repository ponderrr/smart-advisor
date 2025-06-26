import React, { forwardRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Enhanced Input Component
interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            "form-input w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none transition-all duration-200",
            error
              ? "border-red-500"
              : success
              ? "border-green-500"
              : "border-gray-700",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 animate-in fade-in duration-300">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

// Enhanced Textarea Component
interface EnhancedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const EnhancedTextarea = forwardRef<
  HTMLTextAreaElement,
  EnhancedTextareaProps
>(({ className, error, ...props }, ref) => {
  return (
    <div className="relative">
      <textarea
        ref={ref}
        className={cn(
          "form-textarea w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none transition-all duration-200 resize-vertical min-h-[100px]",
          error ? "border-red-500" : "border-gray-700",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
});

EnhancedTextarea.displayName = "EnhancedTextarea";

// Enhanced Button Component
interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
}

export const EnhancedButton = forwardRef<
  HTMLButtonElement,
  EnhancedButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "enhanced-button relative overflow-hidden font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2";

    const variantClasses = {
      primary: "bg-appAccent text-white hover:bg-opacity-90",
      secondary:
        "bg-appSecondary text-textPrimary border border-gray-700 hover:bg-gray-600",
      outline:
        "border border-gray-600 text-textSecondary hover:text-textPrimary hover:border-appAccent",
      ghost: "text-textSecondary hover:text-textPrimary hover:bg-gray-700",
    };

    const sizeClasses = {
      sm: "text-sm px-3 py-2",
      md: "text-base px-4 py-3",
      lg: "text-lg px-6 py-4",
    };

    const glowClass = glow ? "cta-glow" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClass,
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {loading && <div className="enhanced-spinner w-4 h-4" />}
        {children}
      </button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

// Enhanced Progress Bar Component
interface EnhancedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showGlow?: boolean;
}

export const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  value,
  max = 100,
  className = "",
  showGlow = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isHigh = percentage > 66;

  return (
    <div
      className={cn("progress-container w-full h-3 rounded-full", className)}
    >
      <div
        className={cn(
          "progress-fill h-full rounded-full transition-all duration-300",
          isHigh && showGlow
        )}
        style={{ width: `${percentage}%` }}
        data-progress={isHigh ? "high" : "normal"}
      />
    </div>
  );
};

// Enhanced Select Component (for dropdown menus)
interface EnhancedSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string; label: string }[];
}

export const EnhancedSelect = forwardRef<
  HTMLSelectElement,
  EnhancedSelectProps
>(({ className, error, options, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "form-input w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none transition-all duration-200 appearance-none cursor-pointer",
          error ? "border-red-500" : "border-gray-700",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-appSecondary"
          >
            {option.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-textSecondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
});

EnhancedSelect.displayName = "EnhancedSelect";

// Enhanced Password Input with Eye Toggle - FIXED POSITIONING
interface EnhancedPasswordInputProps extends Omit<EnhancedInputProps, "type"> {
  showToggle?: boolean;
}

export const EnhancedPasswordInput: React.FC<EnhancedPasswordInputProps> = ({
  showToggle = true,
  className,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={cn(
          "form-input w-full bg-appPrimary border text-textPrimary text-base font-normal rounded-lg p-4 focus:outline-none transition-all duration-200",
          showToggle ? "pr-12" : "pr-4", // Add right padding when toggle is shown
          error ? "border-red-500" : "border-gray-700",
          className
        )}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center text-textTertiary hover:text-textSecondary transition-colors duration-200 enhanced-button rounded-md hover:bg-gray-700"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showPassword ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            )}
          </svg>
        </button>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
};

// Form Field Wrapper Component
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  className = "",
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-textSecondary text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
};

// Animated Form Container
interface AnimatedFormProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export const AnimatedForm: React.FC<AnimatedFormProps> = ({
  children,
  className = "",
  stagger = true,
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <form className={cn("space-y-6", className)}>
      {stagger
        ? childrenArray.map((child, index) => (
            <div
              key={index}
              className="animate-in fade-in duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </form>
  );
};

// Toast-style notification component
interface ToastProps {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const typeClasses = {
    success: "toast-success bg-green-500 bg-opacity-10 border-green-500",
    error: "toast-error bg-red-500 bg-opacity-10 border-red-500",
    info: "toast-info bg-blue-500 bg-opacity-10 border-blue-500",
    warning: "bg-yellow-500 bg-opacity-10 border-yellow-500 border-l-4",
  };

  const icons = {
    success: (
      <svg
        className="w-5 h-5 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5 text-yellow-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
  };

  return createPortal(
    <div
      className={cn(
        "toast-enter-active fixed top-4 right-4 z-50 p-4 rounded-lg border-l-4 shadow-lg max-w-md",
        typeClasses[type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-textPrimary">{title}</h4>
          {message && (
            <p className="text-sm text-textSecondary mt-1">{message}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-textTertiary hover:text-textPrimary transition-colors duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};
