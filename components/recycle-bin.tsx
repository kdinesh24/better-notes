"use client";

import { useState } from "react";
import type { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface RecycleBinProps {
  deletedNotes: Note[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  isLoading?: boolean;
}

export function RecycleBin({
  deletedNotes,
  onRestore,
  onPermanentDelete,
  isLoading = false,
}: RecycleBinProps) {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handlePermanentDelete = () => {
    if (noteToDelete) {
      onPermanentDelete(noteToDelete);
      setNoteToDelete(null);
    }
  };

  return (
    <div className="w-full">
      <AlertDialog
        open={noteToDelete !== null}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This note will be permanently
              deleted from the recycle bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Recycle Bin</h2>
        <p className="text-muted-foreground">
          Deleted notes are stored here. You can restore them or delete them
          permanently.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-4 bg-card animate-pulse"
            >
              <div className="mb-3">
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
              <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded flex-1"></div>
                <div className="h-8 bg-muted rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : deletedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrashIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Recycle bin is empty</h3>
          <p className="text-muted-foreground">
            Deleted notes will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deletedNotes.map((note) => (
            <div
              key={note.id}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
            >
              <div className="mb-3">
                <h3 className="font-semibold truncate mb-1">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content || "No content"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Deleted{" "}
                {note.deletedAt &&
                  formatDistanceToNow(new Date(note.deletedAt), {
                    addSuffix: true,
                  })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(note.id)}
                  className="flex-1"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Restore
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setNoteToDelete(note.id)}
                  className="flex-1"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
