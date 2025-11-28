"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Upload, 
  Film, 
  ArrowLeft,
  Trash2,
  Edit,
  Search,
  Plus
} from "lucide-react";
import Link from "next/link";

interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  releaseYear: number;
  director: string;
  cast: string;
  posterUrl: string;
  trailerUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface MovieFormData {
  title: string;
  description: string;
  genre: string;
  releaseYear: string;
  director: string;
  cast: string;
  posterUrl: string;
  trailerUrl: string;
}

export default function CreatorDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myMovies, setMyMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState<MovieFormData>({
    title: "",
    description: "",
    genre: "",
    releaseYear: new Date().getFullYear().toString(),
    director: "",
    cast: "",
    posterUrl: "",
    trailerUrl: ""
  });

  // Redirect if not authenticated or not a creator
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (!isPending && session?.user?.role !== "creator") {
      toast.error("Access denied. Only creators can access this page.");
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  // Fetch user's movies
  useEffect(() => {
    if (session?.user && session.user.role === "creator") {
      fetchMyMovies();
    }
  }, [session, searchQuery]);

  const fetchMyMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const params = new URLSearchParams();
      params.append("limit", "100");
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/movies/my-movies?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyMovies(data);
      } else {
        toast.error("Failed to load your movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to load your movies");
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Validate form data
      if (!formData.title.trim()) {
        toast.error("Please enter a movie title");
        setIsSubmitting(false);
        return;
      }

      if (!formData.description.trim()) {
        toast.error("Please enter a description");
        setIsSubmitting(false);
        return;
      }

      const releaseYear = parseInt(formData.releaseYear);
      if (isNaN(releaseYear) || releaseYear < 1800 || releaseYear > new Date().getFullYear() + 2) {
        toast.error("Please enter a valid release year");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          releaseYear: releaseYear
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "FORBIDDEN") {
          toast.error("You must be a creator to upload movies");
          router.push("/dashboard");
        } else {
          toast.error(data.error || "Failed to create movie");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success("Movie uploaded successfully! 🎬");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        genre: "",
        releaseYear: new Date().getFullYear().toString(),
        director: "",
        cast: "",
        posterUrl: "",
        trailerUrl: ""
      });
      
      setShowAddForm(false);
      fetchMyMovies();
    } catch (error) {
      console.error("Error creating movie:", error);
      toast.error("Failed to upload movie");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "creator") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-red-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Creator Studio
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Upload Your Movies 🎬
          </h2>
          <p className="text-gray-400">
            Share your creative work with the world
          </p>
        </div>

        {/* Add Movie Button */}
        {!showAddForm && (
          <div className="mb-8">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Movie
            </Button>
          </div>
        )}

        {/* Upload Form */}
        {showAddForm && (
          <Card className="mb-8 bg-zinc-900/50 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-red-500" />
                Add New Movie
              </CardTitle>
              <CardDescription className="text-gray-400">
                Fill in the details about your movie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Movie Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter movie title"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>

                  {/* Genre */}
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-white">
                      Genre *
                    </Label>
                    <Input
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      placeholder="e.g., Action, Drama, Comedy"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>

                  {/* Release Year */}
                  <div className="space-y-2">
                    <Label htmlFor="releaseYear" className="text-white">
                      Release Year *
                    </Label>
                    <Input
                      id="releaseYear"
                      name="releaseYear"
                      type="number"
                      value={formData.releaseYear}
                      onChange={handleInputChange}
                      placeholder="2024"
                      required
                      min="1800"
                      max={new Date().getFullYear() + 2}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>

                  {/* Director */}
                  <div className="space-y-2">
                    <Label htmlFor="director" className="text-white">
                      Director *
                    </Label>
                    <Input
                      id="director"
                      name="director"
                      value={formData.director}
                      onChange={handleInputChange}
                      placeholder="Director name"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>

                  {/* Poster URL */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="posterUrl" className="text-white">
                      Movie Poster URL *
                    </Label>
                    <Input
                      id="posterUrl"
                      name="posterUrl"
                      value={formData.posterUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/poster.jpg"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>

                  {/* Trailer URL */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="trailerUrl" className="text-white">
                      Trailer/Movie URL *
                    </Label>
                    <Input
                      id="trailerUrl"
                      name="trailerUrl"
                      value={formData.trailerUrl}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/watch?v=... or direct video URL"
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Cast */}
                <div className="space-y-2">
                  <Label htmlFor="cast" className="text-white">
                    Cast & Crew *
                  </Label>
                  <Textarea
                    id="cast"
                    name="cast"
                    value={formData.cast}
                    onChange={handleInputChange}
                    placeholder="List the main cast members (comma separated)"
                    required
                    rows={3}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600 resize-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a detailed description of your movie"
                    required
                    rows={5}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Uploading..." : "Upload Movie"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* My Movies Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">My Movies</h3>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search your movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-600"
              />
            </div>
          </div>

          {isLoadingMovies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-zinc-800 rounded-lg h-80 mb-3"></div>
                  <div className="bg-zinc-800 h-4 rounded mb-2"></div>
                  <div className="bg-zinc-800 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : myMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 backdrop-blur-md rounded-lg border border-red-900/30">
              <Film className="w-20 h-20 text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No movies yet</h3>
              <p className="text-gray-400 text-center max-w-md mb-4">
                {searchQuery
                  ? "No movies match your search"
                  : "Start uploading your movies to share with the world"}
              </p>
              {!searchQuery && !showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Movie
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myMovies.map((movie) => (
                <Card
                  key={movie.id}
                  className="bg-zinc-900/50 backdrop-blur-md border-red-900/30 hover:border-red-700/50 transition-all"
                >
                  <div className="relative overflow-hidden rounded-t-lg aspect-[2/3]">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-1 line-clamp-1">
                      {movie.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-2">
                      {movie.genre} • {movie.releaseYear}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Uploaded: {formatDate(movie.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
