import { db } from "@/lib/db";
import { notes, noteImages, noteLinkPreviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .limit(1);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, id));

    const linkPreviews = await db
      .select()
      .from(noteLinkPreviews)
      .where(eq(noteLinkPreviews.noteId, id));

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      images: imageData,
      linkPreviews: linkPreviewData,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;

    if (linkPreviewData !== undefined) {
      await db.delete(noteLinkPreviews).where(eq(noteLinkPreviews.noteId, id));

      if (linkPreviewData.length > 0) {
        await db.insert(noteLinkPreviews).values(
          linkPreviewData.map((preview: any) => ({
            noteId: id,
            url: preview.url,
            title: preview.title,
            description: preview.description || null,
            image: preview.image || null,
            siteName: preview.siteName || null,
            favicon: preview.favicon || null,
          })),
        );
      }
    }

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
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(noteImages)
      .where(eq(noteImages.noteId, id));

    const linkPreviews = await db
      .select()
      .from(noteLinkPreviews)
      .where(eq(noteLinkPreviews.noteId, id));

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(noteImages).where(eq(noteImages.noteId, id));
    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
