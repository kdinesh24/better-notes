import { db } from "@/lib/db";
import { notes, noteImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, id));

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, images: imageData } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;

    if (imageData !== undefined) {
      const existingImages = await db
        .select()
        .from(noteImages)
        .where(eq(noteImages.noteId, id));

      const existingImagesByUrl = new Map(
        existingImages.map((img) => [img.url, img]),
      );

      await db.delete(noteImages).where(eq(noteImages.noteId, id));

      const imageIdMap = new Map<string, string>();

      if (imageData.length > 0) {
        const imagesToInsert = imageData.map(
          (img: { id: string; url: string; name: string }) => {
            const existing = existingImagesByUrl.get(img.url);
            return {
              noteId: id,
              url: img.url,
              name: img.name,
              originalId: img.id,
              existingId: existing?.id,
            };
          },
        );

        const insertedImages = await db
          .insert(noteImages)
          .values(
            imagesToInsert.map(
              (img: {
                noteId: string;
                url: string;
                name: string;
                originalId: string;
                existingId?: string;
              }) => ({
                noteId: id,
                url: img.url,
                name: img.name,
              }),
            ),
          )
          .returning();

        imagesToInsert.forEach(
          (
            oldImg: {
              noteId: string;
              url: string;
              name: string;
              originalId: string;
              existingId?: string;
            },
            index: number,
          ) => {
            if (insertedImages[index]) {
              imageIdMap.set(oldImg.originalId, insertedImages[index].id);
            }
          },
        );

        if (content !== undefined) {
          let finalContent = content;
          imageIdMap.forEach((newId, oldId) => {
            finalContent = finalContent.replace(
              new RegExp(
                `\\[IMAGE:${oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`,
                "g",
              ),
              `[IMAGE:${newId}]`,
            );
          });
          updateData.content = finalContent;
        }
      } else if (content !== undefined) {
        updateData.content = content;
      }
    } else if (content !== undefined) {
      updateData.content = content;
    }

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, id));

    console.log(
      "[PATCH] Saved successfully, returning",
      images.length,
      "images",
    );

    return NextResponse.json({
      id: updatedNote.id,
      title: updatedNote.title,
      content: updatedNote.content,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
      })),
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.delete(noteImages).where(eq(noteImages.noteId, id));
    await db.delete(notes).where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
