"use client";

import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const savedNotes = localStorage.getItem("better-notes");
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
    } else {
      // Create a welcome note
      const welcomeNote: Note = {
        id: generateId(),
        title: "Welcome to Better Notes",
        content:
          "Start typing to create your first note...\n\nFeatures:\n• Smooth typing experience\n• Ctrl+V to paste images\n• Code blocks with syntax highlighting\n• Beautiful light and dark themes",
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };
      setNotes([welcomeNote]);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("better-notes", JSON.stringify(notes));
    }
  }, [notes]);

  const createNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: "New Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((note) => note.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
      return filtered;
    });
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
            <div className="flex items-center gap-8 flex-1">
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
                <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-jersey-25)]">
                  betternote
                </h1>
              </div>

              <div className="relative ml-20">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[32rem] bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-all duration-200 hover:bg-accent h-9 w-9"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={createNote}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                New Note
              </Button>
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
