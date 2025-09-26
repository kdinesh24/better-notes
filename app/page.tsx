"use client"
import { NotesApp } from "@/components/notes-app"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider>
      <NotesApp />
    </ThemeProvider>
  )
}
