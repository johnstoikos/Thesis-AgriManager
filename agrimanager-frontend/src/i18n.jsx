/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const translations = {
  el: {
    nav: {
      dashboard: "Αρχική",
      fields: "Χωράφια",
      tasks: "Εργασίες",
      analytics: "Στατιστικά",
      profile: "Προφίλ",
    },
    dashboard: {
      eyebrow: "Επισκόπηση εκμετάλλευσης",
      title: "Dashboard Αγροκτήματος",
      description: "Συνοπτική εικόνα χωραφιών, καλλιεργειών, εργασιών και έξυπνων προτάσεων.",
      totalFields: "Συνολικά Χωράφια",
      activeCrops: "Ενεργές Καλλιέργειες",
      pendingTasks: "Εκκρεμείς Εργασίες",
      mapTitle: "Χάρτης Εκμετάλλευσης",
      mapDescription: "Γεωχωρική προβολή χωραφιών και σημείων εργασίας.",
    },
    shell: {
      account: "Λογαριασμός",
      productSubtitle: "Ψηφιακή γεωργία",
      activeSession: "Ενεργή σύνδεση",
      user: "Χρήστης AgriManager",
      logout: "Αποσύνδεση",
      searchPlaceholder: "Αναζήτηση σε χωράφια, εργασίες ή καλλιέργειες...",
    },
  },
  en: {
    nav: {
      dashboard: "Home",
      fields: "Fields",
      tasks: "Tasks",
      analytics: "Analytics",
      profile: "Profile",
    },
    dashboard: {
      eyebrow: "Farm overview",
      title: "Farm Dashboard",
      description: "A concise view of fields, crops, tasks, and smart recommendations.",
      totalFields: "Total Fields",
      activeCrops: "Active Crops",
      pendingTasks: "Pending Tasks",
      mapTitle: "Farm Map",
      mapDescription: "Geospatial view of fields and task points.",
    },
    shell: {
      account: "Account",
      productSubtitle: "Digital agriculture",
      activeSession: "Signed in",
      user: "AgriManager User",
      logout: "Logout",
      searchPlaceholder: "Search fields, tasks, or crops...",
    },
  },
};

export const LanguageContext = createContext(null);

export function AppPreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("agrimanager-language") || "el");
  const [theme, setTheme] = useState(() => localStorage.getItem("agrimanager-theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("agrimanager-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("agrimanager-language", language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      toggleLanguage: () => setLanguage((current) => (current === "el" ? "en" : "el")),
      t: translations[language] || translations.el,
    }),
    [language, theme]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }
  return context;
}
