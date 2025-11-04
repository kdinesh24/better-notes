export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  images?: NoteImage[];
  linkPreviews?: NoteLinkPreview[];
}

export interface NoteImage {
  id: string;
  url: string;
  name: string;
}

export interface NoteLinkPreview {
  id: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}
