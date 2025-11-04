import { db } from "@/lib/db";
import { notes, noteImages, noteLinkPreviews } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [allNotes, allImages, allLinkPreviews] = await Promise.all([
      db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, session.user.id), isNull(notes.deletedAt)))
        .orderBy(notes.updatedAt),
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

    const notesWithImages = allNotes.map((note) => {
      const images = imagesByNoteId[note.id] || [];
      const linkPreviews = previewsByNoteId[note.id] || [];

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
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
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, images: imageData } = body;

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: session.user.id,
        title: title || "New Note",
        content: content || "",
      })
      .returning();

    if (imageData && imageData.length > 0) {
      await db.insert(noteImages).values(
        imageData.map((img: { url: string; name: string }) => ({
          noteId: newNote.id,
          url: img.url,
          name: img.name,
        })),
      );
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, newNote.id));

    const linkPreviews = await db
      .select()
      .from(noteLinkPreviews)
      .where(eq(noteLinkPreviews.noteId, newNote.id));

    return NextResponse.json({
      id: newNote.id,
      title: newNote.title,
      content: newNote.content,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
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
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
