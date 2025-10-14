// Simple localStorage-backed store for folders and queries
const STORAGE_KEY = "savedQueries:v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function save(folders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getFolders() {
  return load();
}

export function setFolders(folders) {
  save(folders);
}

export function addFolder(name) {
  const folders = load();
  const folder = { id: uid(), name: name || "New Folder", queries: [] };
  folders.push(folder);
  save(folders);
  return folder;
}

export function renameFolder(folderId, newName) {
  const folders = load();
  const idx = folders.findIndex(f => f.id === folderId);
  if (idx >= 0) {
    folders[idx].name = newName || folders[idx].name;
    save(folders);
  }
}

export function deleteFolder(folderId) {
  const folders = load().filter(f => f.id !== folderId);
  save(folders);
}

export function addQuery(folderId, query) {
  const folders = load();
  const f = folders.find(f => f.id === folderId);
  if (!f) return null;
  const q = {
    id: uid(),
    name: query.name || "Untitled Query",
    builderState: query.builderState || {},
    flux: query.flux || "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  f.queries.push(q);
  save(folders);
  return q;
}

export function updateQuery(folderId, queryId, patch) {
  const folders = load();
  const f = folders.find(x => x.id === folderId);
  if (!f) return;
  const q = f.queries.find(x => x.id === queryId);
  if (!q) return;
  Object.assign(q, patch, { updatedAt: Date.now() });
  save(folders);
}

export function deleteQuery(folderId, queryId) {
  const folders = load();
  const f = folders.find(x => x.id === folderId);
  if (!f) return;
  f.queries = f.queries.filter(q => q.id !== queryId);
  save(folders);
}