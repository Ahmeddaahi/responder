import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

const EmailVerificationRequired = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // No user session, redirect to auth
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || null);

      // Check if user is already verified
      if (session.user.email_confirmed_at) {
        setIsVerified(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    };

    checkVerificationStatus();

    // Listen for email verification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Your email has been verified. Redirecting...",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleResendVerificationEmail = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email address not found. Please sign in again.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setResendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/send-verification-email`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email: userEmail,
          redirectTo: "https://resbonder.online/pricing",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox (including spam folder) for the verification email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Show success message if verified
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 sm:p-6">
        <Card className="w-full max-w-md p-6 sm:p-8 bg-card/95 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-2xl">
                <img src="/favicon.webp" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24" loading="eager" width="96" height="96" style={{ aspectRatio: '1 / 1' }} />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Email Verified!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your email has been successfully verified. Redirecting you now...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-card/95 backdrop-blur-sm">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl">
              <img src="/favicon.webp" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24" style={{ aspectRatio: '1 / 1' }} />
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Email Verification Required
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Please verify your email address to continue.
            </p>
          </div>

          {/* Email Display */}
          {userEmail && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Your email:</p>
              <p className="text-base font-medium text-foreground">{userEmail}</p>
            </div>
          )}

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-4 sm:p-5">
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              We've sent a verification email to your inbox. Please check your email (including spam folder) and click the verification link to continue.
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Didn't receive the email?
              </p>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                Check your spam folder or click the button below to resend the verification email.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendVerificationEmail}
              disabled={resendingEmail}
              className="w-full"
            >
              {resendingEmail ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerificationRequired;

