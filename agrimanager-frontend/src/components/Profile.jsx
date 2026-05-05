import { useRef, useState } from "react";
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
import { useAppPreferences } from "../i18n";
import { useAuth } from "../context/auth-context";

export default function Profile() {
  const { t } = useAppPreferences();
  const { updateUser, user } = useAuth();
  const labels = t.profile || {};
  const fileInputRef = useRef(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePhoto || user?.avatarUrl || "");
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || user?.username || labels.defaultUser || "AgriManager User",
    email: user?.email || user?.username || "user@agrimanager.local",
    phone: user?.phone || "",
    profilePhoto: user?.profilePhoto || user?.avatarUrl || "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSaved(false);
  };

  const handleSave = async () => {
    const profilePayload = {
      fullName: formData.fullName,
      phone: formData.phone,
      profilePhoto: avatarPreview,
    };

    const updatedProfile = await updateUser(profilePayload);
    if (!updatedProfile) {
      alert(labels.saveError || "Profile could not be saved.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: updatedProfile.fullName || "",
      phone: updatedProfile.phone || "",
      profilePhoto: updatedProfile.profilePhoto || "",
    }));
    setAvatarPreview(updatedProfile.profilePhoto || "");
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 3000);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(labels.imageTypeError || "Please choose an image file.");
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
        eyebrow={labels.eyebrow || "Account settings"}
        title={labels.title || "My Profile"}
        description={labels.description || "Manage user details and preferences."}
        actions={
          <Button onClick={handleSave} size="lg">
            <Save className="h-4 w-4" />
            {labels.save || "Save"}
          </Button>
        }
      />

      {showSaved && (
        <Surface className="flex items-center gap-3 border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-bold">{labels.saved || "Changes saved successfully."}</p>
        </Surface>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title={labels.personalInfo || "Personal Info"}
          description={labels.personalInfoDescription || "Basic contact and user identity details."}
          badge={labels.account || "Account"}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white p-0 text-emerald-700 shadow-inner ring-1 ring-emerald-100 transition hover:ring-4 hover:ring-emerald-200"
                aria-label={labels.choosePhoto || "Choose profile photo"}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={labels.photoAlt || "Profile photo"}
                    className="h-full w-full rounded-full object-cover"
                    decoding="async"
                  />
                ) : (
                  <UserCircle2 className="h-16 w-16" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <Button variant="secondary" className="mt-5 w-full" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {labels.photo || "Photo"}
              </Button>
              <p className="mt-3 text-xs leading-5 text-slate-500">{labels.photoHint || "Click the avatar for an instant preview."}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <FieldLabel>{labels.fullName || "Full name"}</FieldLabel>
                <FieldInput
                  value={formData.fullName}
                  placeholder={labels.fullNamePlaceholder || "e.g. John Papadopoulos"}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>{labels.email || "Email"}</FieldLabel>
                <FieldInput value={formData.email} disabled className="bg-slate-100 text-slate-500" />
              </div>
              <div>
                <FieldLabel>{labels.phone || "Phone"}</FieldLabel>
                <FieldInput
                  value={formData.phone}
                  placeholder={labels.phonePlaceholder || "e.g. 69XXXXXXXX"}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={labels.security || "Security"}
          description={labels.securityDescription || "Manage access and account protection settings."}
          badge={labels.protection || "Protection"}
        >
          <div className="rounded-3xl border border-slate-100 bg-white/70 p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">{labels.password || "Password"}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {labels.passwordDescription || "Change your password regularly for stronger security."}
                </p>
              </div>
            </div>
            <Button variant="secondary" className="mt-5 w-full" onClick={() => setShowPasswordModal(true)}>
              {labels.changePassword || "Change Password"}
            </Button>
          </div>
        </SectionCard>
      </div>

      {showPasswordModal && (
        <ModalShell
          title={labels.changePassword || "Change Password"}
          description={labels.changePasswordDescription || "Password changes will be connected later."}
          onClose={() => setShowPasswordModal(false)}
          size="md"
        >
          <div className="space-y-4 p-6">
            <div>
              <FieldLabel>{labels.currentPassword || "Current Password"}</FieldLabel>
              <FieldInput type="password" placeholder={labels.currentPasswordPlaceholder || "Enter your current password"} />
            </div>
            <div>
              <FieldLabel>{labels.newPassword || "New Password"}</FieldLabel>
              <FieldInput type="password" placeholder={labels.newPasswordPlaceholder || "Enter a new password"} />
            </div>
            <Button className="w-full" onClick={() => setShowPasswordModal(false)}>
              {labels.savePassword || "Save Password"}
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
