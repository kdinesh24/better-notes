import { db } from "@/lib/db";
import { notes, noteImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allNotes = await db
      .select()
      .from(notes)
      .orderBy(notes.updatedAt);

    const notesWithImages = await Promise.all(
      allNotes.map(async (note) => {
        const images = await db
          .select()
          .from(noteImages)
          .where(eq(noteImages.noteId, note.id));

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
        };
      })
    );

    return NextResponse.json(notesWithImages);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, images: imageData } = body;

    const [newNote] = await db
      .insert(notes)
      .values({
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
        }))
      );
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, newNote.id));

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
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
