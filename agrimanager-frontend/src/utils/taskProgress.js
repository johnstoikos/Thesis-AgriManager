export function isHarvestTaskType(taskType) {
  const normalizedType = String(taskType || "").trim().toLocaleLowerCase("el-GR");
  return normalizedType === "harvest" || normalizedType.includes("συγκομιδ");
}

export function getTaskProgress(task) {
  const storedProgress = Number(task?.completionPercentage);
  if (Number.isFinite(storedProgress)) {
    return Math.min(100, Math.max(0, storedProgress));
  }
  return task?.status === "COMPLETED" ? 100 : 0;
}
