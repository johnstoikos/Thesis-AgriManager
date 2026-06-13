import { useEffect, useState } from "react";
import { RefreshCw, ShieldAlert, Trash2, UsersRound } from "lucide-react";
import api from "../api/axios";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  SkeletonLines,
  Surface,
} from "./ui";

function getFullName(user) {
  return user.fullName || user.full_name || "-";
}

function getRoles(user) {
  if (!Array.isArray(user.roles)) return [];
  return user.roles;
}

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
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
      setError("Δεν ήταν δυνατή η φόρτωση των χρηστών.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Να διαγραφεί οριστικά ο χρήστης "${user.username}";\n\nΗ ενέργεια θα διαγράψει και τα σχετικά δεδομένα του.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);
    setError("");

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
    } catch (err) {
      console.error("Σφάλμα διαγραφής χρήστη:", err);
      setError(err.response?.data?.message || "Δεν ήταν δυνατή η διαγραφή του χρήστη.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 md:px-6">
        <PageHeader
          eyebrow="ADMIN MODULE"
          title="Διαχείριση Χρηστών"
          description="Προβολή και διαγραφή εγγεγραμμένων χρηστών της πλατφόρμας."
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
          title="Διαχείριση Χρηστών"
          description="Προβολή και διαγραφή εγγεγραμμένων χρηστών της πλατφόρμας."
        />
        <ErrorState
          title="Σφάλμα φόρτωσης χρηστών"
          description={error}
          action={
            <Button type="button" onClick={fetchUsers} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Επανάληψη
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
        title="Διαχείριση Χρηστών"
        description="Καθαρή λίστα χρηστών με δυνατότητα οριστικής διαγραφής από τον admin."
        actions={
          <Button type="button" onClick={fetchUsers} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Ανανέωση
          </Button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <SectionCard
        title="Χρήστες Πλατφόρμας"
        description="Οι διαχειριστικές κλήσεις προστατεύονται από ROLE_ADMIN στο backend."
      >
        {users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Δεν υπάρχουν χρήστες"
            description="Ο πίνακας θα γεμίσει όταν υπάρχουν εγγεγραμμένοι χρήστες."
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
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/70">
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
                          Διαγραφή
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">
            Η διαγραφή είναι οριστική και πρέπει να χρησιμοποιείται μόνο όταν είσαι βέβαιος ότι δεν χρειάζονται τα δεδομένα του χρήστη.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
