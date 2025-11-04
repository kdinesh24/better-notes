import type { Note } from "@/types/note";

const DB_NAME = "better-notes-db";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const DELETED_NOTES_STORE = "deletedNotes";
const SYNC_STORE = "syncMeta";

interface SyncMeta {
  key: string;
  lastSyncTime: number;
}

class NotesDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === "undefined") return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, {
            keyPath: "id",
          });
          notesStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(DELETED_NOTES_STORE)) {
          const deletedStore = db.createObjectStore(DELETED_NOTES_STORE, {
            keyPath: "id",
          });
          deletedStore.createIndex("deletedAt", "deletedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(SYNC_STORE)) {
          db.createObjectStore(SYNC_STORE, { keyPath: "key" });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Failed to initialize IndexedDB");
    return this.db;
  }

  async getAllNotes(): Promise<Note[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, "readonly");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDeletedNotes(): Promise<Note[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DELETED_NOTES_STORE, "readonly");
      const store = transaction.objectStore(DELETED_NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveNotes(notes: Note[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, "readwrite");
      const store = transaction.objectStore(NOTES_STORE);

      for (const note of notes) {
        store.put(note);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveDeletedNotes(notes: Note[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DELETED_NOTES_STORE, "readwrite");
      const store = transaction.objectStore(DELETED_NOTES_STORE);

      for (const note of notes) {
        store.put(note);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, "readwrite");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDeletedNote(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DELETED_NOTES_STORE, "readwrite");
      const store = transaction.objectStore(DELETED_NOTES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearNotes(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, "readwrite");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearDeletedNotes(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DELETED_NOTES_STORE, "readwrite");
      const store = transaction.objectStore(DELETED_NOTES_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(key: string): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE, "readonly");
      const store = transaction.objectStore(SYNC_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as SyncMeta | undefined;
        resolve(result?.lastSyncTime || 0);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setLastSyncTime(key: string, time: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE, "readwrite");
      const store = transaction.objectStore(SYNC_STORE);
      const request = store.put({ key, lastSyncTime: time });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const notesDB = new NotesDB();
