import { Link } from "react-router-dom";
import { Leaf, ShieldCheck } from "lucide-react";
import { Surface } from "../ui";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Surface className="hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/login" className="inline-flex items-center gap-3 rounded-3xl bg-emerald-950 px-4 py-4 text-white shadow-lg">
              <div className="rounded-2xl bg-emerald-800/70 p-2.5">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">AgriManager</p>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">Smart Farming Workspace</p>
              </div>
            </Link>

            <div className="mt-12 max-w-lg">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Agro Modern SaaS</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Ψηφιακή διαχείριση χωραφιών, καλλιεργειών και εργασιών.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Μία καθαρή και σύγχρονη πλατφόρμα για να οργανώνετε το αγρόκτημα, να παρακολουθείτε τις εργασίες και να λαμβάνετε καλύτερες αποφάσεις.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
              <p className="text-sm font-black text-slate-900">Ορατότητα δεδομένων</p>
              <p className="mt-2 text-sm text-slate-600">Ενιαία εικόνα για έκταση, εργασίες, καιρούς και προτεραιότητες.</p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
              <div className="flex items-center gap-2 text-sky-700">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-black">Ασφαλής πρόσβαση</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Πρόσβαση μόνο για εξουσιοδοτημένους χρήστες με κεντρική είσοδο.</p>
            </div>
          </div>
        </Surface>

        <div className="flex items-center justify-center">
          <Surface className="w-full max-w-xl p-8 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">AgriManager</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6">{footer}</div>}
          </Surface>
        </div>
      </div>
    </div>
  );
}
