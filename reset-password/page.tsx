"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setTokenValid(false);
      setValidatingToken(false);
    } else {
      setTokenValid(true);
      setValidatingToken(false);
    }
  }, [token]);

  const validatePasswords = (): string | null => {
    if (newPassword.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validatePasswords();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!token) {
      toast.error("Invalid or expired reset token");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: newPassword,
        token: token,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password reset successful!");

      // Redirect to login after success
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4 mx-auto"></div>
          <p className="text-gray-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Logo-1762607551467.jpg?width=8000&height=8000&resize=contain')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>

        {/* Error Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-zinc-900/95 backdrop-blur-md border-red-900/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-600/20 p-4 rounded-full">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">Invalid Link</CardTitle>
              <CardDescription className="text-gray-400">
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                Password reset links expire after 1 hour for security reasons.
              </p>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
              >
                Request New Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Logo-1762607551467.jpg?width=8000&height=8000&resize=contain')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>

        {/* Success Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-zinc-900/95 backdrop-blur-md border-red-900/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-600/20 p-4 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">Password Reset Successful</CardTitle>
              <CardDescription className="text-gray-400">
                Your password has been successfully reset. Redirecting to login...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Logo-1762607551467.jpg?width=8000&height=8000&resize=contain')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      {/* Reset Password Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-zinc-900/95 backdrop-blur-md border-red-900/50">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Reset Password</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimum 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:ring-red-600 focus:border-red-600"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-red-500 hover:text-red-400 hover:underline transition-colors"
              >
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
