import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movies } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Search parameter
    const search = searchParams.get('search');

    // Genre filter
    const genre = searchParams.get('genre');

    // Build query conditions
    const conditions = [eq(movies.creatorId, userId)];

    // Add search condition if provided
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(movies.title, searchTerm),
          like(movies.director, searchTerm),
          like(movies.cast, searchTerm)
        )!
      );
    }

    // Add genre filter if provided
    if (genre) {
      conditions.push(eq(movies.genre, genre));
    }

    // Execute query with all conditions
    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    const results = await db
      .select()
      .from(movies)
      .where(whereCondition)
      .orderBy(desc(movies.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}