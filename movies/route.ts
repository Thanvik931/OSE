import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movies } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');

    let query = db.select().from(movies);
    
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(movies.title, `%${search}%`),
          like(movies.director, `%${search}%`),
          like(movies.cast, `%${search}%`)
        )
      );
    }

    if (genre) {
      conditions.push(like(movies.genre, `%${genre}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can create movies', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if ('creatorId' in body) {
      return NextResponse.json(
        { 
          error: "Creator ID cannot be provided in request body",
          code: "CREATOR_ID_NOT_ALLOWED" 
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      genre,
      releaseYear,
      director,
      cast,
      posterUrl,
      trailerUrl
    } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required and must be a non-empty string', code: 'INVALID_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (!genre || typeof genre !== 'string' || genre.trim() === '') {
      return NextResponse.json(
        { error: 'Genre is required and must be a non-empty string', code: 'INVALID_GENRE' },
        { status: 400 }
      );
    }

    if (!releaseYear || typeof releaseYear !== 'number' || isNaN(releaseYear)) {
      return NextResponse.json(
        { error: 'Release year is required and must be a valid number', code: 'INVALID_RELEASE_YEAR' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (releaseYear < 1800 || releaseYear > currentYear + 2) {
      return NextResponse.json(
        { 
          error: `Release year must be between 1800 and ${currentYear + 2}`, 
          code: 'RELEASE_YEAR_OUT_OF_RANGE' 
        },
        { status: 400 }
      );
    }

    if (!director || typeof director !== 'string' || director.trim() === '') {
      return NextResponse.json(
        { error: 'Director is required and must be a non-empty string', code: 'INVALID_DIRECTOR' },
        { status: 400 }
      );
    }

    if (!cast || typeof cast !== 'string' || cast.trim() === '') {
      return NextResponse.json(
        { error: 'Cast is required and must be a non-empty string', code: 'INVALID_CAST' },
        { status: 400 }
      );
    }

    if (!posterUrl || typeof posterUrl !== 'string' || posterUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Poster URL is required and must be a non-empty string', code: 'INVALID_POSTER_URL' },
        { status: 400 }
      );
    }

    if (!trailerUrl || typeof trailerUrl !== 'string' || trailerUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Trailer URL is required and must be a non-empty string', code: 'INVALID_TRAILER_URL' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newMovie = await db.insert(movies)
      .values({
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        releaseYear,
        director: director.trim(),
        cast: cast.trim(),
        posterUrl: posterUrl.trim(),
        trailerUrl: trailerUrl.trim(),
        creatorId: session.user.id,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newMovie[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}