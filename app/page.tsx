"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Trees,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  MapPin,
  Search,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        router.push("/dashboard");
        console.log("Login successful");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-2xl shadow-lg">
                <Trees className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent">
                  Tree Trace
                </h1>
                <p className="text-blue-600 font-medium">
                  Discover Nature's Stories
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Identify, Locate & Learn About Trees
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Join our community of nature enthusiasts and explore the
              fascinating world of trees. Discover species, track locations, and
              unlock the secrets of our natural heritage.
            </p>

            {/* Feature Cards */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Identify Trees
                  </h3>
                  <p className="text-sm text-slate-600">
                    Discover species with detailed information
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100">
                <div className="bg-cyan-100 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Track Locations
                  </h3>
                  <p className="text-sm text-slate-600">
                    Map and explore tree locations
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Leaf className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Learn & Grow</h3>
                  <p className="text-sm text-slate-600">
                    Access premium tree knowledge
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-2xl shadow-lg">
                <Trees className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent">
                  Tree Trace
                </h1>
                <p className="text-blue-600 font-medium text-sm">
                  Discover Nature's Stories
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-slate-800">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-600">
                Sign in to access your tree management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 pr-4 py-3 bg-white/70 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-slate-700 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 pr-12 py-3 bg-white/70 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In to Tree Trace"
                  )}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-slate-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                      onClick={() => {
                        // Add signup navigation here if needed
                        console.log("Navigate to signup");
                      }}
                    >
                      Contact your administrator
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Trusted by nature enthusiasts worldwide
            </p>
            <div className="flex justify-center items-center space-x-4 text-slate-400">
              <div className="flex items-center space-x-1">
                <Trees className="h-4 w-4" />
                <span className="text-xs">Secure</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Leaf className="h-4 w-4" />
                <span className="text-xs">Reliable</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Accurate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
