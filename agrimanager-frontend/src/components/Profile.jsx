import { useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, KeyRound, Save, UserCircle2 } from "lucide-react";
import {
  Button,
  FieldInput,
  FieldLabel,
  ModalShell,
  PageHeader,
  SectionCard,
  Surface,
} from "./ui";

function getStoredUser() {
  const candidates = ["user", "authUser", "currentUser", "profile"];

  for (const key of candidates) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;
      return JSON.parse(value);
    } catch (err) {
      console.warn("Αδυναμία ανάγνωσης στοιχείων χρήστη:", err);
    }
  }

  return {};
}

export default function Profile() {
  const storedUser = useMemo(() => getStoredUser(), []);
  const fileInputRef = useRef(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(storedUser.profilePhoto || storedUser.avatarUrl || "");
  const [formData, setFormData] = useState({
    fullName: storedUser.fullName || storedUser.name || "Χρήστης AgriManager",
    email: storedUser.email || storedUser.username || "user@agrimanager.local",
    phone: storedUser.phone || "",
    profilePhoto: storedUser.profilePhoto || storedUser.avatarUrl || "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("profile", JSON.stringify({ ...formData, profilePhoto: avatarPreview }));
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 3000);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Παρακαλώ επιλέξτε αρχείο εικόνας.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result || "");
      setAvatarPreview(preview);
      setFormData((prev) => ({ ...prev, profilePhoto: preview }));
      setShowSaved(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        eyebrow="Ρυθμίσεις λογαριασμού"
        title="Το Προφίλ μου"
        description="Διαχειριστείτε τα στοιχεία χρήστη, το αγρόκτημα και τις προτιμήσεις που βοηθούν το AgriManager να προσαρμόζει τις προτάσεις του."
        actions={
          <Button onClick={handleSave} size="lg">
            <Save className="h-4 w-4" />
            Αποθήκευση
          </Button>
        }
      />

      {showSaved && (
        <Surface className="flex items-center gap-3 border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-bold">Οι αλλαγές αποθηκεύτηκαν επιτυχώς.</p>
        </Surface>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Προσωπικές Πληροφορίες"
          description="Βασικά στοιχεία επικοινωνίας και ταυτότητας χρήστη."
          badge="Λογαριασμός"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white p-0 text-emerald-700 shadow-inner ring-1 ring-emerald-100 transition hover:ring-4 hover:ring-emerald-200"
                aria-label="Επιλογή φωτογραφίας προφίλ"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Φωτογραφία προφίλ" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-16 w-16" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button variant="secondary" className="mt-5 w-full" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                Φωτογραφία
              </Button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Κάντε κλικ στο avatar για άμεση προεπισκόπηση.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <FieldLabel>Ονοματεπώνυμο</FieldLabel>
                <FieldInput
                  value={formData.fullName}
                  placeholder="π.χ. Γιάννης Παπαδόπουλος"
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <FieldInput value={formData.email} disabled className="bg-slate-100 text-slate-500" />
              </div>
              <div>
                <FieldLabel>Τηλέφωνο</FieldLabel>
                <FieldInput
                  value={formData.phone}
                  placeholder="π.χ. 69XXXXXXXX"
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Ασφάλεια"
          description="Διαχείριση πρόσβασης και μελλοντικές ρυθμίσεις προστασίας λογαριασμού."
          badge="Προστασία"
        >
          <div className="rounded-3xl border border-slate-100 bg-white/70 p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">Κωδικός πρόσβασης</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Αλλάξτε τον κωδικό σας τακτικά για μεγαλύτερη ασφάλεια.
                </p>
              </div>
            </div>
            <Button variant="secondary" className="mt-5 w-full" onClick={() => setShowPasswordModal(true)}>
              Αλλαγή Κωδικού
            </Button>
          </div>
        </SectionCard>
      </div>

      {showPasswordModal && (
        <ModalShell
          title="Αλλαγή Κωδικού"
          description="Η λειτουργία αλλαγής κωδικού θα συνδεθεί με το backend στο επόμενο στάδιο."
          onClose={() => setShowPasswordModal(false)}
          size="md"
        >
          <div className="space-y-4 p-6">
            <div>
              <FieldLabel>Τρέχων Κωδικός</FieldLabel>
              <FieldInput type="password" placeholder="Πληκτρολογήστε τον τρέχοντα κωδικό" />
            </div>
            <div>
              <FieldLabel>Νέος Κωδικός</FieldLabel>
              <FieldInput type="password" placeholder="Πληκτρολογήστε νέο κωδικό" />
            </div>
            <Button className="w-full" onClick={() => setShowPasswordModal(false)}>
              Αποθήκευση Κωδικού
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
