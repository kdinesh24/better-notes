"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { NotesGrid } from "./notes-grid";
import { NoteEditor } from "./note-editor";
import { FloatingNotesSidebar } from "./floating-notes-sidebar";
import type { Note } from "@/types/note";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { notesDB } from "@/lib/db/indexeddb";

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const syncInProgress = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadNotesInstantly();
  }, []);

  const loadNotesInstantly = async () => {
    try {
      const cachedNotes = await notesDB.getAllNotes();
      if (cachedNotes.length > 0) {
        const formattedCached = cachedNotes.map((note) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(formattedCached);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading cached notes:", error);
    }

    syncNotesInBackground();
  };

  const syncNotesInBackground = async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      const response = await fetch("/api/notes");
      if (response.ok) {
        const data = await response.json();
        const formattedNotes = data.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));

        if (formattedNotes.length === 0) {
          const welcomeNote: Note = {
            id: generateId(),
            title: "Welcome to Better Notes",
            content:
              "Start typing to create your first note...\n\nFeatures:\n• Smooth typing experience\n• Ctrl+V to paste images\n• Code blocks with syntax highlighting\n• Beautiful light and dark themes",
            createdAt: new Date(),
            updatedAt: new Date(),
            images: [],
          };
          const created = await createNoteInDB(welcomeNote);
          if (created) {
            setNotes([created]);
            await notesDB.saveNotes([created]);
          }
        } else {
          setNotes(formattedNotes);
          await notesDB.clearNotes();
          await notesDB.saveNotes(formattedNotes);
          await notesDB.setLastSyncTime("notes", Date.now());
        }
      }
    } catch (error) {
      console.error("Error syncing notes:", error);
    } finally {
      setIsLoading(false);
      syncInProgress.current = false;
    }
  };

  const createNoteInDB = async (note: Note) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (response.ok) {
        const data = await response.json();
        const formattedNote = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        setNotes((prev) => [formattedNote, ...prev]);
        await notesDB.saveNotes([formattedNote]);
        return formattedNote;
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const createNote = async () => {
    if (isCreatingNote) return;

    setIsCreatingNote(true);
    try {
      const newNote: Note = {
        id: generateId(),
        title: "New Note",
        content: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };
      const createdNote = await createNoteInDB(newNote);
      if (createdNote) {
        setActiveNoteId(createdNote.id);
      }
    } finally {
      setTimeout(() => setIsCreatingNote(false), 1000);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const updatedNote = {
        ...notes.find((n) => n.id === id)!,
        ...updates,
        updatedAt: new Date(),
      };
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note)),
      );

      await notesDB.saveNotes([updatedNote]);

      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();

        const formattedNote = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? formattedNote : note)),
        );
        await notesDB.saveNotes([formattedNote]);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((note) => note.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
      return filtered;
    });

    await notesDB.deleteNote(id);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        syncNotesInBackground();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      syncNotesInBackground();
    }
  };

  const closeNote = () => {
    if (activeNoteId) {
      const currentNote = notes.find((n) => n.id === activeNoteId);
      if (
        currentNote &&
        !currentNote.title.trim() &&
        !currentNote.content.trim()
      ) {
        deleteNote(activeNoteId);
      } else {
        setActiveNoteId(null);
      }
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {activeNote && (
        <FloatingNotesSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onNoteSelect={setActiveNoteId}
        />
      )}

      <div className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
        <div className="w-full px-8 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo1.png"
                  alt="Better Notes"
                  fill
                  className="object-contain dark:block hidden"
                  priority
                />
                <Image
                  src="/logo2.png"
                  alt="Better Notes"
                  fill
                  className="object-contain dark:hidden block"
                  priority
                />
              </div>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring transition-all duration-200"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => (window.location.href = "/recycle-bin")}
                    className="transition-all duration-200 hover:bg-accent h-9 w-9"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recycle Bin</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-all duration-200 hover:bg-accent h-9 w-9"
              >
                {mounted &&
                  (theme === "dark" ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  ))}
              </Button>
              {session && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={createNote}
                        disabled={isCreatingNote}
                        size="sm"
                        className="bg-white dark:bg-black text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/90 transition-all duration-200 shadow-sm hover:shadow-md border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New Note</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="transition-all duration-200 hover:bg-accent h-9 w-9 rounded-full"
                      >
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="cursor-pointer"
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeNote ? (
          <NoteEditor
            note={activeNote}
            onUpdate={updateNote}
            onClose={closeNote}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-card animate-pulse"
              >
                <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-4 bg-muted rounded w-5/6 mb-3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <NotesGrid
            notes={filteredNotes}
            onNoteSelect={setActiveNoteId}
            onNoteDelete={deleteNote}
            onNoteUpdate={updateNote}
          />
        )}
      </div>
    </div>
  );
}
