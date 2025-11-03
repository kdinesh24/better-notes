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

      const existingImagesById = new Map(
        existingImages.map((img) => [img.id, img]),
      );

      const imageIdsToKeep = new Set(
        imageData.map((img: { id: string }) => img.id),
      );

      const imagesToDelete = existingImages.filter(
        (img) => !imageIdsToKeep.has(img.id),
      );

      for (const img of imagesToDelete) {
        await db.delete(noteImages).where(eq(noteImages.id, img.id));
      }

      const imageIdMap = new Map<string, string>();

      for (const img of imageData) {
        if (existingImagesById.has(img.id)) {
          imageIdMap.set(img.id, img.id);
        } else {
          const [insertedImage] = await db
            .insert(noteImages)
            .values({
              noteId: id,
              url: img.url,
              name: img.name,
            })
            .returning();

          imageIdMap.set(img.id, insertedImage.id);
        }
      }

      if (content !== undefined) {
        let finalContent = content;
        imageIdMap.forEach((newId, oldId) => {
          if (newId !== oldId) {
            finalContent = finalContent.replace(
              new RegExp(
                `\\[IMAGE:${oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`,
                "g",
              ),
              `[IMAGE:${newId}]`,
            );
          }
        });
        updateData.content = finalContent;
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
