"use client";

import { useState, useEffect } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "creator">("user");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    // First create the account
    const { data, error } = await authClient.signUp.email({
      email,
      name,
      password,
    });

    if (error?.code) {
      const errorMap: Record<string, string> = {
        USER_ALREADY_EXISTS: "Email already registered. Please login instead.",
      };
      toast.error(errorMap[error.code] || "Registration failed. Please try again.");
      setIsLoading(false);
      return;
    }

    // Update user role via API
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/user/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        console.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }

    toast.success("Account created successfully!");
    router.push("/login?registered=true");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
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
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      {/* Register form card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-zinc-900/95 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-red-900/50">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent mb-2">
              StreamSphere
            </h1>
            <p className="text-gray-400 text-sm">
              Create your account and start exploring
            </p>
          </div>

          {/* Register form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-200">Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "user"
                      ? "border-red-600 bg-red-600/20 text-white"
                      : "border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-semibold text-sm">User</div>
                  <div className="text-xs mt-1 opacity-80">Watch & Explore</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "creator"
                      ? "border-red-600 bg-red-600/20 text-white"
                      : "border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="text-2xl mb-1">🎬</div>
                  <div className="font-semibold text-sm">Creator</div>
                  <div className="text-xs mt-1 opacity-80">Upload & Share</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="off"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              <Link
                href="/login"
                className="font-semibold text-red-500 hover:text-red-400 hover:underline transition-colors"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}