import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function POST(
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

    const [restoredNote] = await db
      .update(notes)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .returning();

    return NextResponse.json({
      success: true,
      note: {
        id: restoredNote.id,
        title: restoredNote.title,
        content: restoredNote.content,
        createdAt: restoredNote.createdAt,
        updatedAt: restoredNote.updatedAt,
        deletedAt: restoredNote.deletedAt,
      },
    });
  } catch (error) {
    console.error("Error restoring note:", error);
    return NextResponse.json(
      { error: "Failed to restore note" },
      { status: 500 },
    );
  }
}
