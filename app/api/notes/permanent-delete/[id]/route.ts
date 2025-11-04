import { db } from "@/lib/db";
import { notes, noteImages, noteLinkPreviews } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

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

    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt),
        ),
      )
      .limit(1);

    if (!note) {
      return NextResponse.json(
        { error: "Note not found in recycle bin" },
        { status: 404 },
      );
    }

    await db.delete(noteImages).where(eq(noteImages.noteId, id));
    await db.delete(noteLinkPreviews).where(eq(noteLinkPreviews.noteId, id));
    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));

    return NextResponse.json({ success: true, permanentlyDeleted: true });
  } catch (error) {
    console.error("Error permanently deleting note:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete note" },
      { status: 500 },
    );
  }
}
