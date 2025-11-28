import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role is provided
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'ROLE_REQUIRED' },
        { status: 400 }
      );
    }

    // Validate role is either "user" or "creator"
    if (role !== 'user' && role !== 'creator') {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user' or 'creator'", code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Query current user to check existing role
    const currentUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Check if user exists
    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if requested role is the same as current role
    if (currentUser[0].role === role) {
      return NextResponse.json(
        { error: `You are already a ${role}`, code: 'SAME_ROLE' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await db.update(user)
      .set({
        role: role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    // Return success response with updated user data
    return NextResponse.json(
      {
        success: true,
        message: `Successfully switched to ${role} role`,
        user: {
          id: updatedUser[0].id,
          name: updatedUser[0].name,
          email: updatedUser[0].email,
          role: updatedUser[0].role,
          image: updatedUser[0].image,
          createdAt: updatedUser[0].createdAt,
          emailVerified: updatedUser[0].emailVerified,
          updatedAt: updatedUser[0].updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}