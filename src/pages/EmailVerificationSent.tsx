import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle } from "lucide-react";

const EmailVerificationSent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resendingEmail, setResendingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get user email
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserEmail();

    // Listen for email verification
    // Only redirect if the user verifies AFTER being on this page (not if already verified)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect on SIGNED_IN event with verified email (user clicked verification link)
      // Don't redirect if user was already verified when page loaded (auto-verified by Supabase)
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // Check if this is a new verification (user just clicked the link)
        // We can detect this by checking if the event is SIGNED_IN (which happens when clicking verification link)
        // vs INITIAL_SESSION (which happens on page load)
        const wasJustVerified = event === 'SIGNED_IN';
        if (wasJustVerified) {
          // User just verified via email link, redirect to pricing
          navigate("/pricing");
        }
      }
      // Update user email if available
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResendVerificationEmail = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email address not found. Please sign up again.",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-card/95 backdrop-blur-sm">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl">
              <img src="/favicon.webp" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24" loading="eager" width="96" height="96" style={{ aspectRatio: '1 / 1' }} />
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Verification Email Sent!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              We have sent you a verification email to your email address.
            </p>
          </div>

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-4 sm:p-5">
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              Please check your inbox (including spam folder) and click <strong>"Verify"</strong> in the email to open your account.
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                What's next?
              </p>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                After clicking "Verify" in the email, you'll be redirected to choose your plan and get started.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendVerificationEmail}
              disabled={resendingEmail || !userEmail}
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

export default EmailVerificationSent;

