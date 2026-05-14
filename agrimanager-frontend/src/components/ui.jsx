import { createElement } from "react";
import { createPortal } from "react-dom"; // Προσθήκη για τον Τηλεμεταφορέα
import { AlertCircle, Inbox } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  const variantClasses = {
    primary: "bg-emerald-950 text-white shadow-md hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-lg",
    success: "bg-emerald-600 text-white shadow-md hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
    sky: "bg-sky-500 text-white shadow-md hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg",
    danger: "bg-rose-600 text-white shadow-md hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Surface({ children, className = "" }) {
  return (
    <div
      className={cn(
        "box-border w-full max-w-full rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Popover({ children, className = "", align = "right" }) {
  const alignClasses = {
    right: "right-0",
    left: "left-0",
  };

  return (
    <Surface
      className={cn(
        "absolute z-[1300] mt-2 w-[calc(100vw-2rem)] max-w-sm origin-top-right overflow-hidden p-0 animate-[popover-enter_0.16s_ease-out] sm:w-96",
        alignClasses[align],
        className
      )}
    >
      {children}
    </Surface>
  );
}

export function Switch({ checked, onChange, className = "", disabled = false, "aria-label": ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950",
        checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <Surface className={cn("p-6 md:p-7", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100 md:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </Surface>
  );
}

export function StatCard({ icon: Icon, title, value, tone = "emerald", helper }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  };

  return (
    <Surface className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)]">
      <div className={cn("inline-flex rounded-2xl p-3", tones[tone])}>
        {createElement(Icon, { className: "h-5 w-5" })}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">{value}</p>
      {helper && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
    </Surface>
  );
}

export function StatusBadge({ status, children }) {
  const tones = {
    PENDING: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    COMPLETED: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    default: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  };

  const label = children || status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ring-1 ring-inset",
        tones[status] || tones.default
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <Surface className={cn("p-10 text-center", className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {createElement(Icon, { className: "h-7 w-7" })}
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-slate-100">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </Surface>
  );
}

export function ErrorState({ title = "Κάτι πήγε στραβά", description, action }) {
  return (
    <Surface className="p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-slate-100">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </Surface>
  );
}

export function SkeletonLines({ lines = 3, className = "" }) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 rounded-full bg-slate-200/90 dark:bg-slate-700/90",
            index === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SectionCard({ title, description, badge, side, children, className = "" }) {
  return (
    <Surface className={cn("box-border p-5 md:p-6", className)}>
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {badge && (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {badge}
            </span>
          )}
          <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-slate-100">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {side}
      </div>
      <div className="mt-5">{children}</div>
    </Surface>
  );
}

/**
 * ΟΛΟΚΛΗΡΩΜΕΝΟ ModalShell με React Portal:
 * Μεταφέρει το modal στο document.body για να αποφύγει Stacking Context issues.
 */
export function ModalShell({ title, description, onClose, children, className = "", size = "xl" }) {
  const sizeClasses = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-7xl",
  };

  // Ο Τηλεμεταφορέας
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-center items-start overflow-y-auto bg-slate-950/70 p-4 py-8 backdrop-blur-md">
      <div className={cn(
        "w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300",
        sizeClasses[size],
        className
      )}>
        <div className="border-b border-slate-100 px-10 py-8 dark:border-slate-800">
          <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h3>
          {description && <p className="mt-2 text-base font-medium text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        
        <div className="relative">
          {children}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-10 py-6 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 rounded-b-[40px]">
          <Button type="button" variant="secondary" onClick={onClose} className="px-8 h-12 text-base">
            Ακύρωση
          </Button>
        </div>
      </div>
    </div>,
    document.body // Προορισμός: Το σώμα της σελίδας
  );
}

export function FieldLabel({ children }) {
  return <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</label>;
}

export function FieldInput({ className = "", ...props }) {
  return (
    <input
      className={cn(
        // Βασικό στυλ (Light mode)
        "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10",
        // Στυλ για απενεργοποιημένο πεδίο (Light mode)
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        // Στυλ για Dark mode (Ενεργό)
        "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10",
        // ΔΙΟΡΘΩΣΗ: Στυλ για απενεργοποιημένο πεδίο στο Dark Mode
        "dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:disabled:border-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function FieldTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function FieldSelect({ className = "", children, ...props }) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}