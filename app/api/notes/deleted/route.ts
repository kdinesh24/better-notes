import { db } from "@/lib/db";
import { notes, noteImages, noteLinkPreviews } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deletedNotes, allImages, allLinkPreviews] = await Promise.all([
      db
        .select()
        .from(notes)
        .where(
          and(eq(notes.userId, session.user.id), isNotNull(notes.deletedAt)),
        )
        .orderBy(notes.deletedAt),
      db.select().from(noteImages),
      db.select().from(noteLinkPreviews),
    ]);

    const imagesByNoteId = allImages.reduce(
      (acc, img) => {
        if (!acc[img.noteId]) acc[img.noteId] = [];
        acc[img.noteId].push(img);
        return acc;
      },
      {} as Record<string, typeof allImages>,
    );

    const previewsByNoteId = allLinkPreviews.reduce(
      (acc, preview) => {
        if (!acc[preview.noteId]) acc[preview.noteId] = [];
        acc[preview.noteId].push(preview);
        return acc;
      },
      {} as Record<string, typeof allLinkPreviews>,
    );

    const notesWithImages = deletedNotes.map((note) => {
      const images = imagesByNoteId[note.id] || [];
      const linkPreviews = previewsByNoteId[note.id] || [];

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        deletedAt: note.deletedAt,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          name: img.name,
        })),
        linkPreviews: linkPreviews.map((preview) => ({
          id: preview.id,
          url: preview.url,
          title: preview.title,
          description: preview.description || undefined,
          image: preview.image || undefined,
          siteName: preview.siteName || undefined,
          favicon: preview.favicon || undefined,
        })),
      };
    });

    return NextResponse.json(notesWithImages, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching deleted notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted notes" },
      { status: 500 },
    );
  }
}
