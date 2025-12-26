import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock } from "lucide-react";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = emailSchema.parse({ email });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/password-reset?action=request-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ email: validatedData.email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the 6-digit verification code.",
      });

      // Navigate to verify code page with email
      navigate(`/verify-code?email=${encodeURIComponent(validatedData.email)}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-background">
        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Forgot Password
          </h1>
          <p className="text-white/70 mb-8 text-sm sm:text-base">
            Enter your email address and we'll send you a verification code
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-white/90 mb-2 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-base"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              Back to{" "}
              <span className="text-primary hover:text-primary/80 font-medium">Sign In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section - Secure Authentication */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-hero relative overflow-hidden">
        {/* Abstract shapes background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/25 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 border-4 border-white/30 rounded-full flex items-center justify-center">
              <Lock className="w-16 h-16 text-white/80" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Secure Authentication</h2>
          <p className="text-white/90 text-lg leading-relaxed">
            Your data is protected with industry-standard encryption and security measures. Reset your password with confidence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

