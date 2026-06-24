import { Fragment, useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, MapPinned, Power, PowerOff, RefreshCw, ShieldAlert, Trash2, UsersRound } from "lucide-react";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  SkeletonLines,
  Surface,
} from "./ui";

// Επιστρέφει δεδομένα.
function getFullName(user) {
  return user.fullName || user.full_name || "-";
}

// Επιστρέφει δεδομένα.
function getRoles(user) {
  if (!Array.isArray(user.roles)) return [];
  return user.roles;
}

// Ελέγχει εγκυρότητα.
function isUserActive(user) {
  return user.active !== false;
}

const ADMIN_USERS_LABELS = {
  el: {
    title: "Διαχείριση Χρηστών",
    loadingDescription: "Προβολή, ενεργοποίηση και διαχείριση δεδομένων χρηστών της πλατφόρμας.",
    pageDescription: "Λίστα χρηστών με δυνατότητα ενεργοποίησης, απενεργοποίησης, προβολής χωραφιών και διαγραφής.",
    loadErrorTitle: "Σφάλμα φόρτωσης χρηστών",
    loadError: "Δεν ήταν δυνατή η φόρτωση των χρηστών.",
    deleteError: "Δεν ήταν δυνατή η διαγραφή του χρήστη.",
    statusError: "Δεν ήταν δυνατή η αλλαγή κατάστασης του χρήστη.",
    fieldsError: "Δεν ήταν δυνατή η φόρτωση των χωραφιών του χρήστη.",
    fieldDeleteError: "Δεν ήταν δυνατή η διαγραφή του χωραφιού.",
    retry: "Επανάληψη",
    refresh: "Ανανέωση",
    usersTitle: "Χρήστες Πλατφόρμας",
    usersDescription: "Οι διαχειριστικές κλήσεις προστατεύονται από ROLE_ADMIN στο backend.",
    emptyTitle: "Δεν υπάρχουν χρήστες",
    emptyDescription: "Ο πίνακας θα γεμίσει όταν υπάρχουν εγγεγραμμένοι χρήστες.",
    active: "Ενεργός",
    inactive: "Ανενεργός",
    activate: "Ενεργοποίηση",
    deactivate: "Απενεργοποίηση",
    fields: "Χωράφια",
    hideFields: "Απόκρυψη",
    noFields: "Ο χρήστης δεν έχει καταχωρημένα χωράφια.",
    loadingFields: "Φόρτωση χωραφιών...",
    fieldName: "Όνομα",
    area: "Έκταση",
    soil: "Έδαφος",
    soilPh: "pH",
    irrigation: "Άρδευση",
    delete: "Διαγραφή",
    warning: "Η διαγραφή χρήστη ή χωραφιού είναι οριστική. Για προσωρινό αποκλεισμό χρησιμοποίησε την απενεργοποίηση.",
    confirmDelete: (username) =>
      `Να διαγραφεί οριστικά ο χρήστης "${username}";\n\nΗ ενέργεια θα διαγράψει και τα σχετικά δεδομένα του.`,
    confirmDeactivate: (username) =>
      `Να απενεργοποιηθεί ο χρήστης "${username}";\n\nΔεν θα μπορεί να συνδεθεί μέχρι να ενεργοποιηθεί ξανά.`,
    confirmActivate: (username) => `Να ενεργοποιηθεί ξανά ο χρήστης "${username}";`,
    confirmDeleteField: (fieldName) => `Να διαγραφεί οριστικά το χωράφι "${fieldName}";`,
  },
  en: {
    title: "User Management",
    loadingDescription: "View, activate, and manage registered platform users.",
    pageDescription: "User list with activation controls, field viewing, and deletion.",
    loadErrorTitle: "User Loading Error",
    loadError: "Users could not be loaded.",
    deleteError: "The user could not be deleted.",
    statusError: "The user's status could not be changed.",
    fieldsError: "The user's fields could not be loaded.",
    fieldDeleteError: "The field could not be deleted.",
    retry: "Retry",
    refresh: "Refresh",
    usersTitle: "Platform Users",
    usersDescription: "Administrative calls are protected by ROLE_ADMIN on the backend.",
    emptyTitle: "No users found",
    emptyDescription: "The table will populate when registered users exist.",
    active: "Active",
    inactive: "Inactive",
    activate: "Activate",
    deactivate: "Deactivate",
    fields: "Fields",
    hideFields: "Hide",
    noFields: "This user has no registered fields.",
    loadingFields: "Loading fields...",
    fieldName: "Name",
    area: "Area",
    soil: "Soil",
    soilPh: "pH",
    irrigation: "Irrigation",
    delete: "Delete",
    warning: "User and field deletion is permanent. Use deactivation for temporary access removal.",
    confirmDelete: (username) =>
      `Permanently delete user "${username}"?\n\nThis action will also delete the user's related data.`,
    confirmDeactivate: (username) =>
      `Deactivate user "${username}"?\n\nThey will not be able to sign in until reactivated.`,
    confirmActivate: (username) => `Reactivate user "${username}"?`,
    confirmDeleteField: (fieldName) => `Permanently delete field "${fieldName}"?`,
  },
};

// Εμφανίζει στοιχείο διεπαφής.
export default function AdminUsersManagement() {
  const { language } = useAppPreferences();
  const labels = ADMIN_USERS_LABELS[language] || ADMIN_USERS_LABELS.el;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [fieldsByUser, setFieldsByUser] = useState({});
  const [fieldsLoadingId, setFieldsLoadingId] = useState(null);
  const [fieldActionId, setFieldActionId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/users");
      const availableUsers = Array.isArray(response.data) ? response.data : [];
      setUsers(
        availableUsers.filter(
          (user) =>
            getRoles(user).includes("ROLE_USER")
            && !getRoles(user).includes("ROLE_ADMIN")
        )
      );
    } catch (err) {
      console.error("Σφάλμα φόρτωσης χρηστών:", err);
      setError(labels.loadError);
    } finally {
      setLoading(false);
    }
  }, [labels.loadError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Διαγράφει επιλεγμένη εγγραφή.
  const handleDelete = async (user) => {
    const confirmed = window.confirm(labels.confirmDelete(user.username));

    if (!confirmed) return;

    setDeletingId(user.id);
    setError("");

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      setFieldsByUser((currentFields) => {
        const nextFields = { ...currentFields };
        delete nextFields[user.id];
        return nextFields;
      });
    } catch (err) {
      console.error("Σφάλμα διαγραφής χρήστη:", err);
      setError(err.response?.data?.message || labels.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  // Αλλάζει κατάσταση χρήστη.
  const handleStatusToggle = async (user) => {
    const currentlyActive = isUserActive(user);
    const confirmed = window.confirm(
      currentlyActive ? labels.confirmDeactivate(user.username) : labels.confirmActivate(user.username)
    );

    if (!confirmed) return;

    setStatusUpdatingId(user.id);
    setError("");

    try {
      const endpoint = currentlyActive ? "deactivate" : "activate";
      const response = await api.patch(`/api/admin/users/${user.id}/${endpoint}`);
      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === user.id ? response.data : currentUser
      )));
    } catch (err) {
      console.error("Σφάλμα αλλαγής κατάστασης χρήστη:", err);
      setError(err.response?.data?.message || labels.statusError);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Εμφανίζει χωράφια χρήστη.
  const handleToggleFields = async (user) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(user.id);
    if (fieldsByUser[user.id]) return;

    setFieldsLoadingId(user.id);
    setError("");

    try {
      const response = await api.get(`/api/admin/users/${user.id}/fields`);
      setFieldsByUser((currentFields) => ({
        ...currentFields,
        [user.id]: Array.isArray(response.data) ? response.data : [],
      }));
    } catch (err) {
      console.error("Σφάλμα φόρτωσης χωραφιών χρήστη:", err);
      setError(err.response?.data?.message || labels.fieldsError);
    } finally {
      setFieldsLoadingId(null);
    }
  };

  // Διαγράφει επιλεγμένη εγγραφή.
  const handleDeleteField = async (user, field) => {
    const confirmed = window.confirm(labels.confirmDeleteField(field.name || `#${field.id}`));
    if (!confirmed) return;

    setFieldActionId(field.id);
    setError("");

    try {
      await api.delete(`/api/admin/users/${user.id}/fields/${field.id}`);
      setFieldsByUser((currentFields) => ({
        ...currentFields,
        [user.id]: (currentFields[user.id] || []).filter((currentField) => currentField.id !== field.id),
      }));
    } catch (err) {
      console.error("Σφάλμα διαγραφής χωραφιού:", err);
      setError(err.response?.data?.message || labels.fieldDeleteError);
    } finally {
      setFieldActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title={labels.title}
          description={labels.loadingDescription}
        />
        <Surface className="p-6">
          <SkeletonLines lines={8} />
        </Surface>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title={labels.title}
          description={labels.loadingDescription}
        />
        <ErrorState
          title={labels.loadErrorTitle}
          description={error}
          action={
            <Button type="button" onClick={fetchUsers} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              {labels.retry}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
      <PageHeader
        eyebrow="ADMIN MODULE"
        title={labels.title}
        description={labels.pageDescription}
        actions={
          <Button type="button" onClick={fetchUsers} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            {labels.refresh}
          </Button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <SectionCard
        title={labels.usersTitle}
        description={labels.usersDescription}
      >
        {users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => {
                    const active = isUserActive(user);
                    const userFields = fieldsByUser[user.id] || [];
                    const fieldsOpen = expandedUserId === user.id;

                    return (
                      <Fragment key={user.id}>
                        <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-900/70">
                          <td className="whitespace-nowrap px-4 py-4 font-black text-slate-900 dark:text-slate-100">
                            {user.id}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900 dark:text-slate-100">
                            {user.username}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                            {getFullName(user)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                                active
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25"
                                  : "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25",
                              ].join(" ")}
                            >
                              {active ? labels.active : labels.inactive}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {getRoles(user).map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleFields(user)}
                                disabled={fieldsLoadingId === user.id}
                              >
                                {fieldsLoadingId === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : fieldsOpen ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <MapPinned className="h-4 w-4" />
                                )}
                                {fieldsOpen ? labels.hideFields : labels.fields}
                              </Button>
                              <Button
                                type="button"
                                variant={active ? "secondary" : "primary"}
                                size="sm"
                                onClick={() => handleStatusToggle(user)}
                                disabled={statusUpdatingId === user.id}
                              >
                                {statusUpdatingId === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : active ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                                {active ? labels.deactivate : labels.activate}
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                disabled={deletingId === user.id}
                              >
                                {deletingId === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                {labels.delete}
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {fieldsOpen && (
                          <tr className="bg-slate-50/80 dark:bg-slate-900/50">
                            <td colSpan={7} className="px-4 py-4">
                              {fieldsLoadingId === user.id ? (
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  {labels.loadingFields}
                                </div>
                              ) : userFields.length === 0 ? (
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                  <Eye className="h-4 w-4" />
                                  {labels.noFields}
                                </div>
                              ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                                    <thead className="bg-slate-100 font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                      <tr>
                                        <th className="px-3 py-2">ID</th>
                                        <th className="px-3 py-2">{labels.fieldName}</th>
                                        <th className="px-3 py-2">{labels.area}</th>
                                        <th className="px-3 py-2">{labels.soil}</th>
                                        <th className="px-3 py-2">{labels.soilPh}</th>
                                        <th className="px-3 py-2">{labels.irrigation}</th>
                                        <th className="px-3 py-2 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {userFields.map((field) => (
                                        <tr key={field.id}>
                                          <td className="px-3 py-2 font-black text-slate-900 dark:text-slate-100">
                                            {field.id}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">
                                            {field.name || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {field.area ?? "-"}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {field.soilType || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {field.soilPh ?? "-"}
                                          </td>
                                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                            {field.irrigationType || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            <Button
                                              type="button"
                                              variant="danger"
                                              size="sm"
                                              onClick={() => handleDeleteField(user, field)}
                                              disabled={fieldActionId === field.id}
                                            >
                                              {fieldActionId === field.id ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="h-4 w-4" />
                                              )}
                                              {labels.delete}
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">
            {labels.warning}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
