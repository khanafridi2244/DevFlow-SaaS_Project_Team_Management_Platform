import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";

    // Only password fields ever get the toggle — every other input
    // type renders exactly as before, so this change is invisible
    // everywhere except email/password fields.
    const resolvedType = isPasswordField ? (showPassword ? "text" : "password") : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-paper/80">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={resolvedType}
            className={cn(
              "h-10 w-full rounded border border-line bg-white/[0.03] px-3 text-sm text-paper placeholder:text-paper/30",
              "focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal",
              isPasswordField && "pr-10", // room for the toggle icon so text never runs under it
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper"
              tabIndex={-1} // keeps Tab-key navigation flowing to the next real field, not this button
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";