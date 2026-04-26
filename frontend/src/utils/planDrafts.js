const STORAGE_KEY = "renic_plan_drafts";

export function getPlanDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPlanDraftById(id) {
  return getPlanDrafts().find((item) => item.id === id) || null;
}

export function savePlanDraft(draft) {
  const drafts = getPlanDrafts();
  const nextDraft = {
    ...draft,
    id: draft.id || `draft-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };

  const next = drafts.some((item) => item.id === nextDraft.id)
    ? drafts.map((item) => (item.id === nextDraft.id ? nextDraft : item))
    : [nextDraft, ...drafts];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return nextDraft;
}

export function deletePlanDraft(id) {
  const next = getPlanDrafts().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
