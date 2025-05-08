import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-line bg-paper px-4 h-11 text-[15px] text-ink placeholder:text-muted/80 transition focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/10 disabled:opacity-60 aria-[invalid=true]:border-tomato aria-[invalid=true]:ring-tomato/10";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClass, "h-auto min-h-24 py-3 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      inputClass,
      "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238A8275' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-ink-soft", className)} {...props} />;
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-tomato-600">
      {message}
    </p>
  );
}

export function Field({
  label,
  error,
  hint,
  htmlFor,
  className,
  children,
}: {
  label?: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      <FieldError message={error} id={htmlFor ? `${htmlFor}-error` : undefined} />
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex min-h-10 cursor-pointer items-center gap-3 rounded-lg py-1 text-[15px] text-ink-soft", className)}>
      <input
        type="checkbox"
        className="peer size-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-line bg-paper transition checked:border-olive checked:bg-olive checked:bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.5'%3E%3Cpath d='m3.5 8.5 3 3 6-7'/%3E%3C/svg%3E&quot;)] checked:bg-center checked:bg-no-repeat"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
