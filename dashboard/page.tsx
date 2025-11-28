"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Search, 
  Film, 
  TrendingUp, 
  Calendar, 
  User,
  LogOut,
  Play,
  Info,
  X,
  Star,
  Clock,
  Edit2,
  Save,
  Mail,
  Shield,
  Sparkles,
  Upload,
  ImageIcon,
  RefreshCw,
  ArrowUpDown,
  Users,
  Video
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  emailVerified: boolean;
}

interface Movie {
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

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  runtime: number;
  genres: string[];
  director: string;
  cast: string[];
  trailerUrl: string | null;
}

interface CommunityMovie {
  id: number;
  title: string;
  description: string;
  genre: string;
  releaseYear: number;
  director: string;
  cast: string;
  posterUrl: string;
  trailerUrl: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

const GENRE_MAP: { [key: string]: number } = {
  "Action": 28,
  "Adventure": 12,
  "Animation": 16,
  "Comedy": 35,
  "Crime": 80,
  "Documentary": 99,
  "Drama": 18,
  "Family": 10751,
  "Fantasy": 14,
  "History": 36,
  "Horror": 27,
  "Music": 10402,
  "Mystery": 9648,
  "Romance": 10749,
  "Science Fiction": 878,
  "Thriller": 53,
  "TV Movie": 10770,
  "War": 10752,
  "Western": 37
};

export default function DashboardPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpgradingToCreator, setIsUpgradingToCreator] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedImage, setEditedImage] = useState("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Movie state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [communityMovies, setCommunityMovies] = useState<CommunityMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [selectedCommunityMovie, setSelectedCommunityMovie] = useState<CommunityMovie | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // New state for tabs and sorting
  const [activeTab, setActiveTab] = useState<"tmdb" | "community">("tmdb");
  const [sortBy, setSortBy] = useState<string>("popularity.desc");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  // CRITICAL FIX: Sync session with database role
  useEffect(() => {
    if (profile && session?.user) {
      // If database role differs from session role, force session refresh
      if (profile.role !== session.user.role) {
        console.log("Role mismatch detected - refreshing session", {
          databaseRole: profile.role,
          sessionRole: session.user.role
        });
        refetch();
      }
    }
  }, [profile, session, refetch]);

  // Fetch movies when filters change
  useEffect(() => {
    if (session?.user) {
      if (activeTab === "tmdb") {
        fetchMovies();
      } else {
        fetchCommunityMovies();
      }
    }
  }, [session, searchQuery, selectedGenre, currentPage, activeTab, sortBy]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedName(data.name);
        setEditedImage(data.image || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageFile(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsSavingProfile(true);
      const token = localStorage.getItem("bearer_token");

      const payload: any = {
        name: editedName.trim()
      };

      // If user uploaded a file, use that; otherwise use URL
      if (imageFile) {
        payload.imageFile = imageFile;
      } else if (editedImage !== profile?.image) {
        payload.image = editedImage.trim() || null;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      setImageFile(null);
      setImagePreview(null);
      toast.success("Profile updated successfully!");
      refetch(); // Refresh session to update displayed name
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSwitchRole = async (newRole: "user" | "creator") => {
    try {
      setIsSwitchingRole(true);
      const token = localStorage.getItem("bearer_token");

      const response = await fetch("/api/user/switch-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "SAME_ROLE") {
          toast.info(data.error);
        } else {
          throw new Error(data.error || "Failed to switch role");
        }
        return;
      }

      setProfile(data.user);
      const roleLabel = newRole === "creator" ? "creator" : "regular user";
      toast.success(`✨ Successfully switched to ${roleLabel} role!`);
      refetch(); // Refresh session
    } catch (error) {
      console.error("Error switching role:", error);
      toast.error("Failed to switch role");
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.name || "");
    setEditedImage(profile?.image || "");
    setImageFile(null);
    setImagePreview(null);
    setIsEditingProfile(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Fetch TMDB movies
  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("sortBy", sortBy);
      if (searchQuery) params.append("search", searchQuery);
      if (selectedGenre) {
        const genreId = GENRE_MAP[selectedGenre];
        if (genreId) params.append("genre", genreId.toString());
      }

      const response = await fetch(`/api/tmdb?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies);
        setTotalPages(Math.min(data.totalPages, 500)); // TMDB limits to 500 pages
      } else {
        toast.error("Failed to load movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch community movies
  const fetchCommunityMovies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "100");
      if (searchQuery) params.append("search", searchQuery);
      if (selectedGenre) params.append("genre", selectedGenre);

      const response = await fetch(`/api/movies?${params.toString()}`);

      if (response.ok) {
        let data: CommunityMovie[] = await response.json();
        
        // Apply sorting
        data = sortCommunityMovies(data, sortBy);
        
        setCommunityMovies(data);
        setTotalPages(1); // Community movies don't have pagination yet
      } else {
        toast.error("Failed to load community movies");
      }
    } catch (error) {
      console.error("Error fetching community movies:", error);
      toast.error("Failed to load community movies");
    } finally {
      setIsLoading(false);
    }
  };

  const sortCommunityMovies = (data: CommunityMovie[], sortOption: string): CommunityMovie[] => {
    const sorted = [...data];
    
    switch (sortOption) {
      case "title.asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "title.desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "year.asc":
        return sorted.sort((a, b) => a.releaseYear - b.releaseYear);
      case "year.desc":
        return sorted.sort((a, b) => b.releaseYear - a.releaseYear);
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return sorted;
    }
  };

  const fetchMovieDetails = async (movieId: number) => {
    setIsLoadingDetails(true);
    try {
      const API_KEY = "658057f82d26ab78b92edb74ca78985f";
      const BASE_URL = "https://api.themoviedb.org/3";
      const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

      // Fetch movie details, videos, and credits in parallel
      const [detailsRes, videosRes, creditsRes] = await Promise.all([
        fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`),
        fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`),
        fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`)
      ]);

      const details = await detailsRes.json();
      const videos = await videosRes.json();
      const credits = await creditsRes.json();

      // Find trailer
      const trailer = videos.results?.find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube"
      );
      const trailerUrl = trailer
        ? `https://www.youtube.com/embed/${trailer.key}`
        : null;

      // Get director
      const director = credits.crew?.find((c: any) => c.job === "Director");

      // Get top 5 cast members
      const cast = credits.cast?.slice(0, 5).map((c: any) => c.name) || [];

      const movieDetails: MovieDetails = {
        id: details.id,
        title: details.title,
        overview: details.overview || "No description available",
        posterUrl: details.poster_path
          ? `${IMAGE_BASE_URL}${details.poster_path}`
          : "",
        backdropUrl: details.backdrop_path
          ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
          : "",
        releaseDate: details.release_date || "",
        rating: details.vote_average || 0,
        voteCount: details.vote_count || 0,
        runtime: details.runtime || 0,
        genres: details.genres?.map((g: any) => g.name) || [],
        director: director?.name || "Unknown",
        cast: cast,
        trailerUrl: trailerUrl
      };

      setSelectedMovie(movieDetails);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      toast.error("Failed to load movie details");
    } finally {
      setIsLoadingDetails(false);
    }
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

  // Use profile role as source of truth (from database)
  const userRole = profile?.role || session?.user?.role || "user";
  const isCreator = userRole === "creator";

  const genres = Object.keys(GENRE_MAP).sort();
  
  // Community genres (extracted from data)
  const communityGenres = Array.from(new Set(communityMovies.map(m => m.genre))).sort();

  const stats = [
    { 
      label: activeTab === "tmdb" ? "TMDB Movies" : "Community Movies", 
      value: activeTab === "tmdb" ? movies.length : communityMovies.length, 
      icon: Film 
    },
    { label: "Page", value: currentPage, icon: TrendingUp },
    { 
      label: "Total Pages", 
      value: activeTab === "tmdb" ? (totalPages > 500 ? "500+" : totalPages) : "1", 
      icon: Calendar 
    },
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
      {/* Enhanced Header/Navbar */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-red-900/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent hover:from-red-500 hover:to-red-300 transition-all">
                  StreamSphere
                </h1>
              </Link>
              
              {/* Creator Studio Button - More Prominent */}
              {isCreator && (
                <Link href="/dashboard/creator">
                  <Button
                    size="default"
                    className="bg-gradient-to-r from-red-600 via-red-600 to-orange-600 hover:from-red-700 hover:via-red-700 hover:to-orange-700 text-white font-semibold shadow-lg shadow-red-900/50 hover:shadow-red-900/70 transition-all animate-pulse hover:animate-none"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Creator Studio
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <Badge 
                variant={isCreator ? "default" : "secondary"}
                className={isCreator 
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500/50 hidden sm:flex"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hidden sm:flex"
                }
              >
                <Shield className="w-3 h-3 mr-1" />
                {isCreator ? "Creator" : "User"}
              </Badge>
              
              {/* Profile Button */}
              <button
                onClick={() => setShowProfile(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-red-900/30 hover:border-red-700/50 hover:bg-zinc-900/80 transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-red-500" />
                <span className="text-sm text-white font-medium">{session.user.name}</span>
              </button>
              
              {/* Profile Button Mobile */}
              <button
                onClick={() => setShowProfile(true)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900/50 border border-red-900/30 hover:border-red-700/50 transition-all"
              >
                <User className="w-5 h-5 text-red-500" />
              </button>
              
              {/* Sign Out Button */}
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-white hover:text-white"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, {session.user.name}! 👋
              </h2>
              <p className="text-gray-400">
                Discover movies from TMDB and our creative community
              </p>
            </div>
            
            {/* Quick Action Button for Non-Creators */}
            {!isCreator && (
              <Button
                onClick={() => setShowProfile(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Become a Creator
              </Button>
            )}
          </div>
        </div>

        {/* Tabs with Enhanced Styling */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => {
              setActiveTab("tmdb");
              setCurrentPage(1);
              setSearchQuery("");
              setSelectedGenre("");
            }}
            variant={activeTab === "tmdb" ? "default" : "outline"}
            className={
              activeTab === "tmdb"
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"
                : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white hover:border-red-700/50"
            }
          >
            <Film className="w-4 h-4 mr-2" />
            TMDB Movies
          </Button>
          <Button
            onClick={() => {
              setActiveTab("community");
              setCurrentPage(1);
              setSearchQuery("");
              setSelectedGenre("");
            }}
            variant={activeTab === "community" ? "default" : "outline"}
            className={
              activeTab === "community"
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"
                : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white hover:border-red-700/50"
            }
          >
            <Users className="w-4 h-4 mr-2" />
            Community Movies
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-zinc-900/50 backdrop-blur-md rounded-lg p-6 border border-red-900/30 hover:border-red-700/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className="w-10 h-10 text-red-500/50" />
              </div>
            </div>
          ))}
        </div>

        {/* Search, Sort and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search movies by title, director, or cast..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-12 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600 h-12"
              />
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[200px] bg-zinc-900/50 border-zinc-700 text-white h-12">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {activeTab === "tmdb" ? (
                  <>
                    <SelectItem value="popularity.desc" className="text-white hover:bg-zinc-800">Most Popular</SelectItem>
                    <SelectItem value="popularity.asc" className="text-white hover:bg-zinc-800">Least Popular</SelectItem>
                    <SelectItem value="vote_average.desc" className="text-white hover:bg-zinc-800">Highest Rated</SelectItem>
                    <SelectItem value="vote_average.asc" className="text-white hover:bg-zinc-800">Lowest Rated</SelectItem>
                    <SelectItem value="release_date.desc" className="text-white hover:bg-zinc-800">Newest Release</SelectItem>
                    <SelectItem value="release_date.asc" className="text-white hover:bg-zinc-800">Oldest Release</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="newest" className="text-white hover:bg-zinc-800">Recently Added</SelectItem>
                    <SelectItem value="oldest" className="text-white hover:bg-zinc-800">First Added</SelectItem>
                    <SelectItem value="title.asc" className="text-white hover:bg-zinc-800">Title (A-Z)</SelectItem>
                    <SelectItem value="title.desc" className="text-white hover:bg-zinc-800">Title (Z-A)</SelectItem>
                    <SelectItem value="year.desc" className="text-white hover:bg-zinc-800">Year (Newest)</SelectItem>
                    <SelectItem value="year.asc" className="text-white hover:bg-zinc-800">Year (Oldest)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Genre Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setSelectedGenre("");
                setCurrentPage(1);
              }}
              variant={selectedGenre === "" ? "default" : "outline"}
              size="sm"
              className={
                selectedGenre === ""
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
              }
            >
              All Genres
            </Button>
            {(activeTab === "tmdb" ? genres : communityGenres).map((genre) => (
              <Button
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setCurrentPage(1);
                }}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                className={
                  selectedGenre === genre
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
                }
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-zinc-800 rounded-lg h-80 mb-3"></div>
                <div className="bg-zinc-800 h-4 rounded mb-2"></div>
                <div className="bg-zinc-800 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : activeTab === "tmdb" && movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Film className="w-20 h-20 text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
            <p className="text-gray-400 text-center max-w-md">
              {searchQuery || selectedGenre
                ? "Try adjusting your search or filters"
                : "Start exploring our vast library of movies"}
            </p>
          </div>
        ) : activeTab === "community" && communityMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-20 h-20 text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No community movies yet</h3>
            <p className="text-gray-400 text-center max-w-md mb-4">
              {searchQuery || selectedGenre
                ? "No movies match your search"
                : "Be the first to upload a movie to the community!"}
            </p>
            {session.user.role === "creator" && !searchQuery && !selectedGenre && (
              <Link href="/dashboard/creator">
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Movie
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* TMDB Movies Grid */}
            {activeTab === "tmdb" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group cursor-pointer"
                    onClick={() => fetchMovieDetails(movie.id)}
                  >
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3]">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchMovieDetails(movie.id);
                              }}
                            >
                              <Info className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-white font-semibold">
                          {movie.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{movie.releaseYear || 'N/A'}</span>
                      <span className="text-xs">
                        ⭐ {movie.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Community Movies Grid */}
            {activeTab === "community" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {communityMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedCommunityMovie(movie)}
                  >
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3]">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommunityMovie(movie);
                              }}
                            >
                              <Info className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
                        <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                          Community
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{movie.genre}</span>
                      <span className="text-xs">{movie.releaseYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {activeTab === "tmdb" && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-white">
                  Page {currentPage} of {totalPages > 500 ? "500+" : totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Profile Modal */}
      {showProfile && profile && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isEditingProfile && setShowProfile(false)}
        >
          <div
            className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      View and update your personal details
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditingProfile ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingProfile(true)}
                          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                          <Edit2 className="size-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowProfile(false)}
                          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSavingProfile}
                          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                          <X className="size-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                        >
                          <Save className="size-4 mr-1" />
                          {isSavingProfile ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="size-20 border-2 border-red-600/50">
                    {(imagePreview || (isEditingProfile ? editedImage : profile.image)) ? (
                      <img
                        src={imagePreview || (isEditingProfile ? editedImage : profile.image) || ""}
                        alt={profile.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = `<div class="size-full flex items-center justify-center bg-red-600 text-white text-2xl font-semibold">${profile.name.charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-red-600 text-white text-2xl font-semibold">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={profile.role === "creator" ? "default" : "secondary"} className="bg-red-600 hover:bg-red-700">
                        <Shield className="size-3 mr-1" />
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </Badge>
                      {profile.emailVerified && (
                        <Badge variant="outline" className="text-xs border-green-600 text-green-500">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Switching Section */}
                {!isEditingProfile && (
                  <div className="p-4 border-2 border-red-600/50 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-red-600/20">
                        <RefreshCw className="size-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">Switch Account Role</h4>
                        <p className="text-sm text-gray-400 mb-3">
                          {profile.role === "creator" 
                            ? "Switch back to a regular user account if you no longer want creator privileges."
                            : "Upgrade to a creator account to upload and manage your own movies on StreamSphere."}
                        </p>
                        <Button
                          onClick={() => handleSwitchRole(profile.role === "creator" ? "user" : "creator")}
                          disabled={isSwitchingRole}
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                        >
                          <RefreshCw className="size-4 mr-2" />
                          {isSwitchingRole 
                            ? "Switching..." 
                            : profile.role === "creator" 
                              ? "Switch to User" 
                              : "Become a Creator"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable/Display Fields */}
                {isEditingProfile ? (
                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your name"
                        disabled={isSavingProfile}
                        className="bg-zinc-800 border-zinc-700 text-white focus:border-red-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageFile" className="text-white">
                        Profile Image (Upload File)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isSavingProfile}
                          className="bg-zinc-800 border-zinc-700 text-white focus:border-red-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                        />
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Upload an image file (max 5MB) or use URL below
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-white">
                        Profile Image URL (Alternative)
                      </Label>
                      <Input
                        id="image"
                        value={editedImage}
                        onChange={(e) => setEditedImage(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={isSavingProfile || !!imageFile}
                        className="bg-zinc-800 border-zinc-700 text-white focus:border-red-600"
                      />
                      <p className="text-xs text-gray-500">
                        {imageFile ? "Clear uploaded file to use URL" : "Leave empty to use initial avatar"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-800">
                        <User className="size-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Full Name</p>
                        <p className="font-medium text-white">{profile.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-800">
                        <Mail className="size-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Email Address</p>
                        <p className="font-medium text-white">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-800">
                        <Shield className="size-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Account Role</p>
                        <p className="font-medium text-white capitalize">{profile.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-800">
                        <Calendar className="size-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Member Since</p>
                        <p className="font-medium text-white">{formatDate(profile.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Note */}
                {!isEditingProfile && (
                  <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-800/50">
                    <p className="text-sm text-gray-400">
                      <strong className="text-white">Note:</strong> Your email address cannot be changed. 
                      If you need to update your email, please contact support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Movie Details Modal */}
      {selectedMovie && !showTrailer && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingDetails ? (
              <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <>
                <div className="relative h-64 sm:h-96">
                  <img
                    src={selectedMovie.backdropUrl || selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                  <Button
                    onClick={() => setSelectedMovie(null)}
                    variant="outline"
                    size="icon"
                    className="absolute top-4 right-4 border-white/50 bg-black/50 hover:bg-black/70 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="p-6 sm:p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {selectedMovie.title}
                  </h2>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Film className="w-4 h-4" />
                      <span>{selectedMovie.genres.join(", ") || "N/A"}</span>
                    </div>
                    {selectedMovie.runtime > 0 && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{selectedMovie.runtime} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-semibold">
                        {selectedMovie.rating.toFixed(1)}/10
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({selectedMovie.voteCount.toLocaleString()} votes)
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {selectedMovie.overview}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-gray-400 font-semibold">Director: </span>
                      <span className="text-white">{selectedMovie.director}</span>
                    </div>
                    {selectedMovie.cast.length > 0 && (
                      <div>
                        <span className="text-gray-400 font-semibold">Cast: </span>
                        <span className="text-white">{selectedMovie.cast.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {selectedMovie.trailerUrl ? (
                      <Button
                        onClick={() => setShowTrailer(true)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch Trailer
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="bg-gray-600 cursor-not-allowed"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        No Trailer Available
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Community Movie Details Modal */}
      {selectedCommunityMovie && !showTrailer && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCommunityMovie(null)}
        >
          <div
            className="bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-96">
              <img
                src={selectedCommunityMovie.posterUrl}
                alt={selectedCommunityMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
              <Button
                onClick={() => setSelectedCommunityMovie(null)}
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 border-white/50 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
              <Badge className="absolute top-4 left-4 bg-red-600 hover:bg-red-700">
                <Users className="w-3 h-3 mr-1" />
                Community Upload
              </Badge>
            </div>
            
            <div className="p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {selectedCommunityMovie.title}
              </h2>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedCommunityMovie.releaseYear}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Film className="w-4 h-4" />
                  <span>{selectedCommunityMovie.genre}</span>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {selectedCommunityMovie.description}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-gray-400 font-semibold">Director: </span>
                  <span className="text-white">{selectedCommunityMovie.director}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold">Cast: </span>
                  <span className="text-white">{selectedCommunityMovie.cast}</span>
                </div>
              </div>

              <div className="flex gap-4">
                {selectedCommunityMovie.trailerUrl ? (
                  <Button
                    onClick={() => {
                      window.open(selectedCommunityMovie.trailerUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Movie
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="bg-gray-600 cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    No Video Available
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {selectedMovie && showTrailer && selectedMovie.trailerUrl && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => setShowTrailer(false)}
              variant="outline"
              size="icon"
              className="absolute -top-12 right-0 border-white/50 bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <X className="w-4 h-4" />
            </Button>
            <iframe
              src={selectedMovie.trailerUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      )}
    </div>
  );
}