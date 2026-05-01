import { createElement } from "react";
import { AlertCircle, Inbox, X } from "lucide-react";

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
        "rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      {children}
    </div>
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
    PENDING: "bg-amber-100 text-amber-700 ring-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
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
    <Surface className={cn("p-5 md:p-6", className)}>
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
        <div>
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

export function ModalShell({ title, description, onClose, children, className = "", size = "xl" }) {
  const sizeClasses = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className={cn("w-full overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl duration-300 animate-[modal-pop_0.22s_ease-out] dark:border-slate-700 dark:bg-slate-900", sizeClasses[size], className)}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="pr-4">
            <h3 className="text-xl font-black text-slate-950 dark:text-slate-100">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-xl p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
        <div className="flex justify-end border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Ακύρωση
          </Button>
        </div>
      </div>
    </div>
  );
}


export function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{children}</label>;
}

export function FieldInput({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30",
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
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30",
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
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
