import { AlertTriangle, BellRing, CloudRain, Droplets, Wind } from "lucide-react";
import { Surface } from "./ui";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSoilType(profile = {}, fields = []) {
  return (
    profile.soilType ||
    profile.defaultSoilType ||
    profile.farmSoilType ||
    fields.find((field) => field?.soilType || field?.soil)?.soilType ||
    fields.find((field) => field?.soilType || field?.soil)?.soil ||
    ""
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getRainDeadline(weather = {}) {
  const candidates = [
    weather.rainExpectedAt,
    weather.expectedRainAt,
    weather.precipitationExpectedAt,
    weather.rainTime,
    weather.precipitationTime,
  ];
  const rawValue = candidates.find(Boolean);

  if (rawValue) {
    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("el-GR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
    }
    return String(rawValue);
  }

  const fallback = new Date();
  fallback.setHours(fallback.getHours() + 3);
  return new Intl.DateTimeFormat("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fallback);
}

function buildNotifications({ weather, profile, fields }) {
  const windSpeed = toNumber(weather?.windSpeed ?? weather?.windSpeedKmh ?? weather?.wind_kph);
  const rainProbability = toNumber(
    weather?.rainProbability ?? weather?.precipitationProbability ?? weather?.precipitationChance
  );
  const temperature = toNumber(weather?.temperature ?? weather?.tempC ?? weather?.temp);
  const soilType = String(getSoilType(profile, fields));
  const today = formatDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatDate(tomorrowDate);

  const notifications = [];

  if (soilType === "Αμμώδες" && temperature !== null && temperature > 30) {
    notifications.push({
      id: "irrigation-alert",
      tone: "info",
      icon: Droplets,
      title: "Πότισμα",
      message: `Έχεις να κάνεις Πότισμα μέχρι την ${today}`,
      meta: `${temperature}°C · ${soilType}`,
    });
  }

  if (windSpeed !== null && windSpeed > 15) {
    notifications.push({
      id: "spraying-delay-alert",
      tone: "warning",
      icon: Wind,
      title: "Ψεκασμός",
      message: `⚠️ Υψηλός άνεμος: Έχεις να αναβάλεις τον Ψεκασμό μέχρι την ${tomorrow}`,
      meta: `${windSpeed} km/h`,
    });
  }

  if (rainProbability !== null && rainProbability > 60) {
    notifications.push({
      id: "rain-deadline-alert",
      tone: "warning",
      icon: CloudRain,
      title: "Εξωτερικές εργασίες",
      message: `Έχεις να ολοκληρώσεις τις εξωτερικές εργασίες μέχρι την ${getRainDeadline(weather)}`,
      meta: `${rainProbability}% πιθανότητα βροχής`,
    });
  }

  if (!notifications.length) {
    notifications.push({
      id: "all-clear",
      tone: "success",
      icon: BellRing,
      title: "Χωρίς ειδοποιήσεις",
      message: "Δεν υπάρχουν επείγουσες εργασίες από τον Smart Notification Advisor.",
      meta: "Ενημερωμένο",
    });
  }

  return notifications;
}

const toneClasses = {
  info: {
    card: "border-l-sky-500 bg-sky-50/80 dark:bg-sky-950/25",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    meta: "text-sky-700 dark:text-sky-300",
  },
  warning: {
    card: "border-l-amber-500 bg-amber-50/90 dark:bg-amber-950/20 animate-pulse",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    meta: "text-amber-700 dark:text-amber-300",
  },
  success: {
    card: "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    meta: "text-emerald-700 dark:text-emerald-300",
  },
};

export default function AgriAdvisor({ weather, profile, fields = [], loading = false }) {
  const notifications = buildNotifications({ weather, profile, fields });

  return (
    <Surface className="p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Smart Notification Advisor
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-slate-100">Notification List</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Ειδοποιήσεις με βάση καιρό, έδαφος και προτεραιότητα εργασιών.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Ανάλυση συνθηκών...</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = notification.icon;
            const tone = toneClasses[notification.tone];
            return (
              <article
                key={notification.id}
                className={`rounded-2xl border border-slate-200 border-l-4 p-4 shadow-sm dark:border-slate-800 ${tone.card}`}
              >
                <div className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{notification.title}</h3>
                      <span className={`text-[11px] font-black uppercase tracking-wide ${tone.meta}`}>
                        {notification.meta}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Surface>
  );
}
