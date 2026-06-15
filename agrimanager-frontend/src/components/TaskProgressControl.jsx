import { useRef, useState } from "react";
import { getTaskProgress, isHarvestTaskType } from "../utils/taskProgress";

export default function TaskProgressControl({ task, onSave, labels = {}, compact = false }) {
  const [draftProgress, setDraftProgress] = useState(() => getTaskProgress(task));
  const [draftYield, setDraftYield] = useState(task.harvestedYieldAmount ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rangeInputRef = useRef(null);

  const harvestTask = isHarvestTaskType(task.taskType);
  const completed = task.status === "COMPLETED" || getTaskProgress(task) === 100;

  const persistProgress = async (nextProgress, nextYield = draftYield) => {
    if (saving) return;

    const normalizedProgress = Number(nextProgress);
    const normalizedYield = nextYield === "" ? null : Number(nextYield);

    if (completed) return;

    if (harvestTask && normalizedProgress === 100 && normalizedYield === null) {
      setError(labels.yieldRequired || "Συμπληρώστε τα κιλά συγκομιδής πριν την ολοκλήρωση.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updatedTask = await onSave({
        progress: normalizedProgress,
        yieldAmount: harvestTask ? normalizedYield : null,
      });
      setDraftProgress(getTaskProgress(updatedTask));
      setDraftYield(updatedTask.harvestedYieldAmount ?? "");
    } catch (err) {
      setDraftProgress(getTaskProgress(task));
      setDraftYield(task.harvestedYieldAmount ?? "");
      setError(
        err.response?.data?.message
          || err.response?.data?.detail
          || labels.progressError
          || "Αποτυχία ενημέρωσης προόδου."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "mt-3 space-y-2" : "min-w-[220px] space-y-2"}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{labels.progress || "Πρόοδος"}</span>
        <span>{draftProgress}%</span>
      </div>
      <input
        ref={rangeInputRef}
        type="range"
        min="0"
        max="100"
        step="1"
        value={draftProgress}
        disabled={completed || saving}
        onChange={(event) => setDraftProgress(Number(event.target.value))}
        onPointerUp={(event) => persistProgress(Number(event.currentTarget.value))}
        onKeyUp={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
            persistProgress(Number(event.currentTarget.value));
          }
        }}
        className="h-2 w-full cursor-pointer accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={labels.progress || "Πρόοδος εργασίας"}
      />

      {harvestTask && (
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {labels.harvestedYield || "Ποσότητα συγκομιδής (Kg)"}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={draftYield}
            disabled={completed || saving}
            onChange={(event) => setDraftYield(event.target.value)}
            onBlur={(event) => {
              if (event.relatedTarget !== rangeInputRef.current) {
                persistProgress(draftProgress, draftYield);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-950"
          />
        </label>
      )}

      {saving && (
        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          {labels.savingProgress || "Αποθήκευση..."}
        </p>
      )}
      {error && <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  );
}
