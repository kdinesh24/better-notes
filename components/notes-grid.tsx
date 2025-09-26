"use client"

import type React from "react"

import { useState } from "react"
import type { Note } from "@/types/note"
import { Button } from "@/components/ui/button"
import { TrashIcon, PhotoIcon } from "@heroicons/react/24/outline"
import { formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NotesGridProps {
  notes: Note[]
  onNoteSelect: (id: string) => void
  onNoteDelete: (id: string) => void
  onNoteUpdate: (id: string, updates: Partial<Note>) => void
}

export function NotesGrid({ notes, onNoteSelect, onNoteDelete, onNoteUpdate }: NotesGridProps) {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const handleQuickEdit = (note: Note, field: "title" | "content", value: string) => {
    onNoteUpdate(note.id, { [field]: value })
  }

  const handleDeleteClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (noteToDelete) {
      onNoteDelete(noteToDelete)
      setNoteToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 transition-colors">
          <PhotoIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-medium mb-2">No notes yet</h2>
        <p className="text-muted-foreground">Create your first note to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in-0 duration-500">
        {notes.map((note, index) => (
          <div
            key={note.id}
            className="note-card bg-card border border-border rounded-lg p-4 cursor-pointer relative group transition-all duration-300 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
            onMouseEnter={() => setHoveredNote(note.id)}
            onMouseLeave={() => setHoveredNote(null)}
            onClick={() => onNoteSelect(note.id)}
          >
            {hoveredNote === note.id && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => handleDeleteClick(e, note.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}

            <input
              type="text"
              value={note.title}
              onChange={(e) => handleQuickEdit(note, "title", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent border-none outline-none text-base font-medium mb-3 resize-none transition-colors placeholder:text-muted-foreground"
              placeholder="Note title..."
            />

            <div className="text-sm text-muted-foreground mb-3 line-clamp-4 leading-relaxed">
              {note.content || "No content"}
            </div>

            {note.images && note.images.length > 0 && (
              <div className="flex gap-1 mb-3 overflow-hidden">
                {note.images.slice(0, 3).map((image) => (
                  <img
                    key={image.id}
                    src={image.url || "/placeholder.svg"}
                    alt={image.name}
                    className="w-12 h-12 object-cover rounded border transition-transform hover:scale-105"
                  />
                ))}
                {note.images.length > 3 && (
                  <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs transition-colors">
                    +{note.images.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
