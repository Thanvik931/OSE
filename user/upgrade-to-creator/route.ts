import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Check current user role
    const currentUser = await db.select({
      id: user.id,
      role: user.role
    })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if already a creator
    if (currentUser[0].role === 'creator') {
      return NextResponse.json({ 
        error: 'You are already a creator', 
        code: 'ALREADY_CREATOR' 
      }, { status: 400 });
    }

    // Upgrade to creator
    const updatedUser = await db.update(user)
      .set({
        role: 'creator',
        updatedAt: new Date()
      })
      .where(eq(user.id, session.user.id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to upgrade account', 
        code: 'UPGRADE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to creator account',
      user: updatedUser[0]
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/user/upgrade-to-creator error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
