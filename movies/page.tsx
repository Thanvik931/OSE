"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Search, 
  Film, 
  User,
  LogOut,
  Play,
  X,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
}

interface MovieDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
}

interface Credits {
  cast: { id: number; name: string; character?: string; profile_path: string }[];
  crew: { id: number; name: string; job: string; profile_path: string }[];
}

export default function MoviesPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [tvShows, setTVShows] = useState<TMDBTVShow[]>([]);
  const [genres, setGenres] = useState<{ [key: number]: string }>({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("");
  
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<"movie" | "tv">("movie");
  const [showPlayer, setShowPlayer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  const API_KEY = "658057f82d26ab78b92edb74ca78985f";
  const BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
  const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadGenres();
      loadTrendingMovies();
      loadTVShows();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && genres && Object.keys(genres).length > 0) {
      if (searchQuery) {
        handleSearch();
      } else {
        loadMovies();
      }
    }
  }, [session, searchQuery, selectedGenre, selectedYear, sortBy, genres]);

  const loadGenres = async () => {
    try {
      const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
      const data = await response.json();
      const genreMap: { [key: number]: string } = {};
      data.genres.forEach((genre: { id: number; name: string }) => {
        genreMap[genre.id] = genre.name;
      });
      setGenres(genreMap);
    } catch (error) {
      console.error("Error loading genres:", error);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
      const data = await response.json();
      setTrendingMovies(data.results.slice(0, 10));
    } catch (error) {
      console.error("Error loading trending movies:", error);
    }
  };

  const loadTVShows = async () => {
    try {
      const response = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
      const data = await response.json();
      setTVShows(data.results.slice(0, 8));
    } catch (error) {
      console.error("Error loading TV shows:", error);
    }
  };

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${randomPage}`;

      if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      if (selectedYear) url += `&primary_release_year=${selectedYear}`;
      if (sortBy) url += `&sort_by=${sortBy}`;

      const response = await fetch(url);
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error("Error loading movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMovies();
      return;
    }

    setIsLoading(true);
    try {
      const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`;
      const response = await fetch(url);
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const openPlayer = async (id: number, type: "movie" | "tv") => {
    setSelectedMovie(id);
    setSelectedType(type);
    setShowPlayer(true);
    setIsLoadingDetails(true);
    setTrailerKey(null);
    setMovieDetails(null);
    setCredits(null);

    try {
      const endpoint = type === "movie" ? "movie" : "tv";
      
      // Fetch trailer
      const videosResponse = await fetch(`${BASE_URL}/${endpoint}/${id}/videos?api_key=${API_KEY}`);
      const videosData = await videosResponse.json();
      const trailer = videosData.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer") 
        || videosData.results?.find((v: any) => v.site === "YouTube");
      setTrailerKey(trailer?.key || null);

      // Fetch details
      const detailsResponse = await fetch(`${BASE_URL}/${endpoint}/${id}?api_key=${API_KEY}`);
      const details = await detailsResponse.json();
      setMovieDetails(details);

      // Fetch credits
      const creditsResponse = await fetch(`${BASE_URL}/${endpoint}/${id}/credits?api_key=${API_KEY}`);
      const creditsData = await creditsResponse.json();
      setCredits(creditsData);

    } catch (error) {
      console.error("Error loading movie details:", error);
      toast.error("Failed to load details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setSelectedMovie(null);
    setTrailerKey(null);
    setMovieDetails(null);
    setCredits(null);
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("");
    setSelectedYear("");
    setSortBy("");
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const carousel = document.getElementById("trendingCarousel");
    if (carousel) {
      const scrollAmount = 320;
      carousel.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const years = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => new Date().getFullYear() - i);
  const genresList = Object.entries(genres).map(([id, name]) => ({ id, name }));
  const sortOptions = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "vote_average.desc", label: "Highest Rating" },
    { value: "primary_release_date.desc", label: "Latest" },
    { value: "title.asc", label: "Alphabetical" }
  ];

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-red-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                  StreamSphere
                </h1>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/movies" className="text-white font-semibold">
                  Movies
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-red-900/30">
                <User className="w-4 h-4 text-red-500" />
                <span className="text-sm text-white">{session.user.name}</span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600 h-12"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-zinc-900/50 border-zinc-700 text-white rounded-md px-4 py-2 focus:ring-red-600 focus:border-red-600"
            >
              <option value="">All Genres</option>
              {genresList.map((genre) => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-zinc-900/50 border-zinc-700 text-white rounded-md px-4 py-2 focus:ring-red-600 focus:border-red-600"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900/50 border-zinc-700 text-white rounded-md px-4 py-2 focus:ring-red-600 focus:border-red-600"
            >
              <option value="">Sort By</option>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {(searchQuery || selectedGenre || selectedYear || sortBy) && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="border-red-600/50 text-red-500 hover:bg-red-600/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Trending Movies Carousel */}
        {!searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => scrollCarousel("left")}
                  variant="outline"
                  size="icon"
                  className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => scrollCarousel("right")}
                  variant="outline"
                  size="icon"
                  className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div 
              id="trendingCarousel"
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="relative flex-shrink-0 w-72 cursor-pointer group"
                  onClick={() => openPlayer(movie.id, "movie")}
                >
                  <div className="relative rounded-lg overflow-hidden aspect-[2/3]">
                    <img
                      src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : FALLBACK_IMAGE}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white font-bold text-2xl w-12 h-12 flex items-center justify-center rounded-md">
                      {index + 1}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold mb-1">{movie.title}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-300">{movie.release_date?.split('-')[0]}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-white">{movie.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movies Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            {searchQuery ? `Search Results for "${searchQuery}"` : selectedGenre || selectedYear ? "Filtered Movies" : "Discover Movies"}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-zinc-800 rounded-lg aspect-[2/3] mb-2"></div>
                  <div className="bg-zinc-800 h-4 rounded mb-1"></div>
                  <div className="bg-zinc-800 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Film className="w-20 h-20 text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group cursor-pointer"
                  onClick={() => openPlayer(movie.id, "movie")}
                >
                  <div className="relative overflow-hidden rounded-lg mb-2 aspect-[2/3]">
                    <img
                      src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : FALLBACK_IMAGE}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-white font-semibold">
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-red-500 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {movie.release_date?.split('-')[0] || 'TBA'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TV Shows Section */}
        {!searchQuery && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Trending TV Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tvShows.map((show) => (
                <div
                  key={show.id}
                  className="group cursor-pointer"
                  onClick={() => openPlayer(show.id, "tv")}
                >
                  <div className="relative overflow-hidden rounded-lg mb-2 aspect-[2/3]">
                    <img
                      src={show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : FALLBACK_IMAGE}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-white font-semibold">
                        {show.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-red-500 transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {show.first_air_date?.split('-')[0] || 'TBA'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Player Modal */}
      {showPlayer && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={closePlayer}
        >
          <div className="min-h-screen flex items-start justify-center p-4 pt-20">
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                onClick={closePlayer}
                variant="outline"
                size="icon"
                className="absolute -top-14 right-0 border-white/50 bg-black/50 hover:bg-black/70 text-white z-10"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                {trailerKey ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-xl">Trailer not available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Movie Details */}
              <div className="bg-zinc-900/95 rounded-lg p-6">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : movieDetails ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {movieDetails.title || movieDetails.name}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>{(movieDetails.release_date || movieDetails.first_air_date)?.split('-')[0]}</span>
                        {movieDetails.runtime && <span>{movieDetails.runtime} min</span>}
                        {movieDetails.number_of_seasons && <span>{movieDetails.number_of_seasons} Seasons</span>}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-white font-semibold">{movieDetails.vote_average.toFixed(1)}/10</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {movieDetails.genres?.map((genre) => (
                          <span key={genre.id} className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs">
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-300 leading-relaxed">{movieDetails.overview}</p>

                    {/* Cast */}
                    {credits?.cast && credits.cast.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">Cast</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {credits.cast.slice(0, 8).map((person) => (
                            <div key={person.id} className="text-sm">
                              <p className="text-white font-semibold">{person.name}</p>
                              {person.character && <p className="text-gray-400 text-xs">{person.character}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crew */}
                    {credits?.crew && credits.crew.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">Crew</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {credits.crew.slice(0, 8).map((person) => (
                            <div key={person.id} className="text-sm">
                              <p className="text-white font-semibold">{person.name}</p>
                              <p className="text-gray-400 text-xs">{person.job}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
