"use client";

import { useState, useEffect, useRef } from "react";
import type { Note } from "@/types/note";
import { RecycleBin } from "@/components/recycle-bin";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { notesDB } from "@/lib/db/indexeddb";

export default function RecycleBinPage() {
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const syncInProgress = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    loadDeletedNotesInstantly(controller.signal);
    return () => controller.abort();
  }, []);

  const loadDeletedNotesInstantly = async (signal?: AbortSignal) => {
    try {
      const cachedNotes = await notesDB.getAllDeletedNotes();
      if (cachedNotes.length > 0) {
        const formattedCached = cachedNotes.map((note) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          deletedAt: note.deletedAt ? new Date(note.deletedAt) : null,
        }));
        setDeletedNotes(formattedCached);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Error loading cached deleted notes:", error);
    }

    syncDeletedNotesInBackground(signal);
  };

  const syncDeletedNotesInBackground = async (signal?: AbortSignal) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      const response = await fetch("/api/notes/deleted", { signal });
      if (response.ok) {
        const data = await response.json();
        const formattedNotes = data.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          deletedAt: note.deletedAt ? new Date(note.deletedAt) : null,
        }));
        setDeletedNotes(formattedNotes);
        await notesDB.clearDeletedNotes();
        await notesDB.saveDeletedNotes(formattedNotes);
        await notesDB.setLastSyncTime("deletedNotes", Date.now());
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error syncing deleted notes:", error);
      }
    } finally {
      setIsInitialLoad(false);
      syncInProgress.current = false;
    }
  };

  const handleRestore = async (id: string) => {
    setDeletedNotes((prev) => prev.filter((note) => note.id !== id));
    await notesDB.deleteDeletedNote(id);

    try {
      const response = await fetch(`/api/notes/restore/${id}`, {
        method: "POST",
      });
      if (!response.ok) {
        syncDeletedNotesInBackground();
      }
    } catch (error) {
      console.error("Error restoring note:", error);
      syncDeletedNotesInBackground();
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletedNotes((prev) => prev.filter((note) => note.id !== id));
    await notesDB.deleteDeletedNote(id);

    try {
      const response = await fetch(`/api/notes/permanent-delete/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        syncDeletedNotesInBackground();
      }
    } catch (error) {
      console.error("Error permanently deleting note:", error);
      syncDeletedNotesInBackground();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="w-full px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RecycleBin
          deletedNotes={deletedNotes}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          isLoading={isInitialLoad}
        />
      </div>
    </div>
  );
}
