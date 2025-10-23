"use client";

import { useState, useEffect } from "react";
import { NotesGrid } from "./notes-grid";
import { NoteEditor } from "./note-editor";
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

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-all duration-200 hover:bg-accent"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={createNote}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
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
            onClose={() => setActiveNoteId(null)}
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
