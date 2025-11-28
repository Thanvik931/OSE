import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
      {/* Movie posters background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Logo-1762607551467.jpg?width=8000&height=8000&resize=contain')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            StreamSphere
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            Your Ultimate Movie & Series Explorer
          </p>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Discover, explore, and stream thousands of movies and series. Watch trailers, read descriptions, and dive into the world of entertainment.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/login">
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-lg px-8 py-6 transition-all"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/register">
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-red-600/50 bg-red-600/10 hover:bg-red-600/20 text-white backdrop-blur-md font-semibold text-lg px-8 py-6 transition-all"
            >
              Create Account
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-lg p-6 border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="text-4xl mb-3">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">Vast Library</h3>
            <p className="text-white/70 text-sm">
              Access thousands of movies and series from various genres
            </p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-lg p-6 border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="text-4xl mb-3">🎥</div>
            <h3 className="text-xl font-bold text-white mb-2">Stream Trailers</h3>
            <p className="text-white/70 text-sm">
              Watch high-quality trailers before you decide what to watch
            </p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-lg p-6 border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">Detailed Info</h3>
            <p className="text-white/70 text-sm">
              Get complete information about cast, crew, ratings, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}