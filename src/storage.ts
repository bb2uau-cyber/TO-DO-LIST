export const load = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
export const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export type BackgroundImage = { id: string; name: string; url: string };
const dbName = 'my-little-world'; const storeName = 'backgrounds';
const open = () => new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open(dbName, 1); req.onupgradeneeded = () => req.result.createObjectStore(storeName, { keyPath: 'id' }); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
export async function saveBackground(item: BackgroundImage) { const db = await open(); await new Promise<void>((resolve, reject) => { const r=db.transaction(storeName,'readwrite').objectStore(storeName).put(item); r.onsuccess=()=>resolve(); r.onerror=()=>reject(r.error); }); db.close(); }
export async function getBackgrounds(): Promise<BackgroundImage[]> { const db=await open(); const values=await new Promise<BackgroundImage[]>((resolve,reject)=>{const r=db.transaction(storeName).objectStore(storeName).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();return values; }
export async function deleteBackground(id: string) { const db=await open(); await new Promise<void>((resolve,reject)=>{const r=db.transaction(storeName,'readwrite').objectStore(storeName).delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)});db.close(); }
