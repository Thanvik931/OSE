import { NextRequest, NextResponse } from "next/server";

const API_KEY = "658057f82d26ab78b92edb74ca78985f";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const FALLBACK_IMAGE_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  adult: boolean;
}

interface TransformedMovie {
  id: number;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  releaseYear: number;
  releaseDate: string;
  rating: number;
  voteCount: number;
  genreIds: number[];
  popularity: number;
  language: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const sortBy = searchParams.get("sortBy") || "popularity.desc";
    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";

    let endpoint = "";
    let url = "";

    // If there's a search query, use search endpoint
    if (search) {
      endpoint = "/search/movie";
      url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(
        search
      )}&page=${page}&include_adult=false`;
    } else {
      // Otherwise use discover endpoint with sorting
      endpoint = "/discover/movie";
      url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&sort_by=${sortBy}&page=${page}&include_adult=false`;

      // Add genre filter if specified
      if (genre) {
        url += `&with_genres=${genre}`;
      }
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the movies to our format
    const transformedMovies: TransformedMovie[] = data.results.map(
      (movie: TMDBMovie) => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview || "No description available",
        posterUrl: movie.poster_path
          ? `${IMAGE_BASE_URL}${movie.poster_path}`
          : FALLBACK_IMAGE_URL,
        backdropUrl: movie.backdrop_path
          ? `${IMAGE_BASE_URL}${movie.backdrop_path}`
          : FALLBACK_IMAGE_URL,
        releaseYear: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : 0,
        releaseDate: movie.release_date || "",
        rating: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        genreIds: movie.genre_ids || [],
        popularity: movie.popularity || 0,
        language: movie.original_language || "en",
      })
    );

    return NextResponse.json({
      movies: transformedMovies,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    });
  } catch (error) {
    console.error("Error fetching TMDB movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies from TMDB" },
      { status: 500 }
    );
  }
}
