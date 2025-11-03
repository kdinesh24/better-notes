"use client";

import { useState } from "react";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import {
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FloatingNotesSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
}

export function FloatingNotesSidebar({
  notes,
  activeNoteId,
  onNoteSelect,
}: FloatingNotesSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const NAVBAR_HEIGHT = 65;

  return (
    <>
      <div
        className="fixed left-0 bottom-0 w-3 z-40 hover:bg-accent/20 transition-colors"
        style={{ top: `${NAVBAR_HEIGHT}px` }}
        onMouseEnter={() => setIsHovered(true)}
      />

      <div
        className={cn(
          "fixed left-0 bottom-0 z-40 transition-all duration-300 ease-in-out",
          isHovered ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ top: `${NAVBAR_HEIGHT}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-full w-72 bg-background border-r border-border/50 shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="px-4 py-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight">
                    All Notes
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {notes.length}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {notes.map((note) => {
                  const isActive = note.id === activeNoteId;
                  const preview = note.content
                    .replace(/\[CODE:[^\]]*\][\s\S]*?\[\/CODE\]/g, "")
                    .replace(/\[IMAGE:\d+\]/g, "")
                    .trim()
                    .substring(0, 80);

                  return (
                    <button
                      key={note.id}
                      onClick={() => onNoteSelect(note.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200 group relative",
                        "hover:bg-accent/80 hover:shadow-sm",
                        isActive
                          ? "bg-accent/60 border border-accent-foreground/10 shadow-sm"
                          : "border border-transparent hover:border-border/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            className={cn(
                              "text-sm font-medium truncate leading-tight",
                              isActive
                                ? "text-foreground"
                                : "text-foreground/90",
                            )}
                          >
                            {note.title || "Untitled Note"}
                          </h3>
                          {preview && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {preview}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-1">
                            <span>
                              {new Date(note.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    new Date(note.updatedAt).getFullYear() !==
                                    new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <ChevronRightIcon
                          className={cn(
                            "h-4 w-4 transition-all flex-shrink-0 mt-0.5",
                            isActive
                              ? "text-foreground opacity-100"
                              : "text-muted-foreground/50 opacity-0 group-hover:opacity-100",
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
