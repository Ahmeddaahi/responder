import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required. Please start from the forgot password page.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [email, navigate, toast]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const validatedData = codeSchema.parse({ code });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/password-reset?action=verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email,
            code: validatedData.code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      toast({
        title: "Code Verified",
        description: "Please set your new password.",
      });

      // Navigate to reset password page
      navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(validatedData.code)}`);
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
          description: error.message || "Invalid or expired verification code",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/password-reset?action=request-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-card/95 backdrop-blur-sm">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-white rounded-2xl">
              <img src="/favicon.webp" alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20" loading="eager" width="80" height="80" style={{ aspectRatio: '1 / 1' }} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Enter Verification Code</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              required
              autoFocus
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="text-primary hover:underline text-sm block w-full"
          >
            Resend Code
          </button>
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-muted-foreground hover:underline text-sm block w-full"
          >
            Use a different email
          </button>
        </div>
      </Card>
    </div>
  );
};

export default VerifyCode;

