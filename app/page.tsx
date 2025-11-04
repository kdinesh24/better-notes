"use client";
import { NotesApp } from "@/components/notes-app";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NotesApp />
      </ThemeProvider>
    </SessionProvider>
  );
}
