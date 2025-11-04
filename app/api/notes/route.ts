import { db } from "@/lib/db";
import { notes, noteImages, noteLinkPreviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, session.user.id))
      .orderBy(notes.updatedAt);

    const notesWithImages = await Promise.all(
      allNotes.map(async (note) => {
        const images = await db
          .select()
          .from(noteImages)
          .where(eq(noteImages.noteId, note.id));

        const linkPreviews = await db
          .select()
          .from(noteLinkPreviews)
          .where(eq(noteLinkPreviews.noteId, note.id));

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
      }),
    );

    return NextResponse.json(notesWithImages);
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
