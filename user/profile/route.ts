import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Query user profile
    const userProfile = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified
    })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(userProfile[0], { status: 200 });
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { name, image, imageFile } = body;

    // Check if any fields to update
    if (name === undefined && image === undefined && imageFile === undefined) {
      return NextResponse.json({ 
        error: 'No fields to update', 
        code: 'NO_FIELDS' 
      }, { status: 400 });
    }

    // Build update object
    const updates: { name?: string; image?: string | null; updatedAt: Date } = {
      updatedAt: new Date()
    };

    // Validate and add name if provided
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      
      if (!trimmedName) {
        return NextResponse.json({ 
          error: 'Name must be a non-empty string', 
          code: 'INVALID_NAME' 
        }, { status: 400 });
      }
      
      updates.name = trimmedName;
    }

    // Handle image upload (base64 file or URL)
    if (imageFile !== undefined) {
      // Validate base64 image format
      if (imageFile && typeof imageFile === 'string') {
        // Check if it's a valid base64 image
        if (!imageFile.startsWith('data:image/')) {
          return NextResponse.json({ 
            error: 'Invalid image format. Must be a base64 encoded image', 
            code: 'INVALID_IMAGE_FORMAT' 
          }, { status: 400 });
        }
        
        // Check file size (limit to 5MB base64)
        if (imageFile.length > 5 * 1024 * 1024 * 1.37) { // base64 is ~37% larger
          return NextResponse.json({ 
            error: 'Image file is too large. Maximum size is 5MB', 
            code: 'IMAGE_TOO_LARGE' 
          }, { status: 400 });
        }
        
        updates.image = imageFile;
      } else if (imageFile === null) {
        updates.image = null;
      }
    } else if (image !== undefined) {
      // Handle URL-based image
      updates.image = image;
    }

    // Update user profile
    const updatedUser = await db.update(user)
      .set(updates)
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
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}