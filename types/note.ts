export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  images?: NoteImage[]
}

export interface NoteImage {
  id: string
  url: string
  name: string
}
