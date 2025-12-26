import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

// Determine the redirect URL based on environment
const getRedirectUrl = () => {
  // Always use the production domain for OAuth providers
  // This ensures OAuth redirects work correctly in all environments
  return "https://resbonder.online/auth";
};

// Get pricing page URL for email verification redirect
const getPricingRedirectUrl = () => {
  return "https://resbonder.online/pricing";
};

// Determine the dashboard URL based on environment
const getDashboardUrl = () => {
  // Always use the production domain for consistency
  return "https://resbonder.online/dashboard";
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false); // Track if we're in the middle of a signup
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Handle OAuth callback from redirect
    const handleOAuthCallback = async () => {
      // Check if this is an OAuth callback by looking for hash or code in URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code');

      if (hasOAuthParams) {
        console.log('🔐 OAuth callback detected, processing...');
        setLoading(true);

        try {
          // Supabase automatically handles the OAuth callback
          // We just need to wait for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('OAuth callback error:', error);
            toast({
              title: "Authentication Error",
              description: error.message || "Failed to complete sign in",
              variant: "destructive",
            });
            setLoading(false);
            // Clean up URL
            window.history.replaceState({}, document.title, '/auth');
            return;
          }

          if (session) {
            console.log('✅ OAuth session established');
            // Clean up URL parameters
            window.history.replaceState({}, document.title, '/auth');
            // Auth state change listener will handle navigation
          }
        } catch (error: any) {
          console.error('Error processing OAuth callback:', error);
          toast({
            title: "Error",
            description: "Failed to complete authentication",
            variant: "destructive",
          });
          setLoading(false);
          window.history.replaceState({}, document.title, '/auth');
        }
      }
    };

    // Handle email verification callback from email link
    const handleVerificationCallback = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type) {
        console.log('🔗 Email verification callback detected:', { tokenHash, type });
        setLoading(true);

        try {
          // Supabase automatically handles the verification when the link is clicked
          // We just need to wait for the session to be updated
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session after verification:', error);
            toast({
              title: "Verification Error",
              description: "There was an error verifying your email. Please try again.",
              variant: "destructive",
            });
            return;
          }

          if (session?.user?.email_confirmed_at) {
            toast({
              title: "Email Verified!",
              description: "Your email has been successfully verified.",
            });
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            // Redirect will be handled by auth state change listener
          } else {
            toast({
              title: "Verification Pending",
              description: "Please wait while we verify your email...",
            });
          }
        } catch (error: any) {
          console.error('Error handling verification callback:', error);
          toast({
            title: "Error",
            description: error.message || "An error occurred during verification.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
    handleVerificationCallback();

    // Check if user is already logged in
    // Only redirect if we're on the auth page itself
    const currentPath = window.location.pathname;
    if (currentPath === '/auth' || currentPath === '/') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Check if email is verified
          const provider = session.user.app_metadata?.provider || 'email';
          const isOAuthUser = provider === 'google' || provider === 'facebook';

          if (!isOAuthUser && !session.user.email_confirmed_at) {
            // User is logged in but email not verified, redirect to verification required page
            navigate("/email-verification-required");
          } else {
            navigate("/dashboard");
          }
        }
      });
    }

    // Check URL parameters to determine if we should show sign up or sign in
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'signin') {
      setIsLogin(true);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed event:', event, 'User:', session?.user?.email, 'User ID:', session?.user?.id);

      if (session) {
        const userId = session.user.id;
        const userEmail = session.user.email;
        const userCreatedAt = new Date(session.user.created_at);
        const now = new Date();
        const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;

        // Check the authentication provider
        const provider = session.user.app_metadata?.provider || 'email';
        const isOAuthUser = provider === 'google' || provider === 'facebook';

        console.log('👤 User details:', {
          email: userEmail,
          id: userId,
          created_at: session.user.created_at,
          seconds_since_creation: secondsSinceCreation,
          event: event,
          provider: provider,
          isOAuthUser: isOAuthUser,
        });

        // Check if this is a new user by checking if they have any agents configured
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        const isNewUser = !agents || agents.length === 0;

        console.log('🔍 User status check:', {
          hasAgents: agents && agents.length > 0,
          isNewUser,
          event,
          provider,
          isOAuthUser,
        });

        // OAuth users (Google/Facebook) don't need verification emails
        // They're already verified by their OAuth provider
        // Only email/password signups need verification emails
        // OAuth users go directly to pricing page
        // Email/password signups are handled in the signup handler (handleSubmit)

        // Don't redirect if we're in the middle of an email/password signup
        // The handleSubmit function will handle the redirect to /email-verification-sent
        // Also check if email/password user hasn't verified email yet
        const isEmailPasswordUser = !isOAuthUser;
        const isEmailVerified = !!session.user.email_confirmed_at;

        // Check current route - don't redirect if we're on verification pages
        const currentPath = window.location.pathname;
        const isOnVerificationPage = currentPath === '/email-verification-sent' ||
          currentPath === '/email-verification-required';

        if ((isSigningUp && !isOAuthUser) || (isEmailPasswordUser && !isEmailVerified) || isOnVerificationPage) {
          console.log('⏳ Email/password signup in progress or email not verified or on verification page, skipping redirect in listener', {
            isSigningUp,
            isEmailPasswordUser,
            isEmailVerified,
            isOnVerificationPage,
            currentPath
          });
          return; // Don't redirect, let handleSubmit do it or wait for email verification
        }

        if (isNewUser && isOAuthUser) {
          // New OAuth user - redirect directly to pricing (no email verification needed)
          console.log('🆕 New OAuth user detected, redirecting to pricing page');
          navigate("/pricing");
        } else if (!isNewUser) {
          // Existing user - redirect to dashboard
          console.log('👤 Existing user, redirecting to dashboard');
          navigate("/dashboard");
        } else {
          // New email/password user - let the signup handler manage the redirect
          // The handleSubmit function will redirect to /email-verification-sent
          console.log('⏳ New email/password user detected, letting signup handler manage redirect to email verification page');
          // Don't redirect here - let handleSubmit do it
        }
      } else {
        console.log('⚠️ No session in auth state change event');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams, isSigningUp]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Use redirect-based OAuth flow (more reliable than popups)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to sign in with Google",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // User will be redirected to Google, then back to our app
      // Loading state will persist during redirect
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Helper function to send welcome email for any user (OAuth or email/password)
  const sendWelcomeEmailForUser = async (userEmail: string, userId: string, silent: boolean = false) => {
    try {
      // Check if we've already sent email for this user (avoid duplicates)
      const emailSentKey = `welcome_email_sent_${userId}`;
      const alreadySent = localStorage.getItem(emailSentKey);

      if (alreadySent) {
        console.log('📧 Welcome email already sent for user:', userEmail);
        return true;
      }

      console.log('📧 Sending welcome email for user:', userEmail, 'User ID:', userId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/send-verification-email`;

      console.log('🔗 Calling Edge Function:', functionUrl);
      console.log('📤 Request payload:', {
        email: userEmail,
        redirectTo: getPricingRedirectUrl(),
      });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email: userEmail,
          redirectTo: getPricingRedirectUrl(),
        }),
      });

      console.log('📥 Response status:', response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log('📥 Response data:', responseData);

      if (!response.ok) {
        console.error('❌ Failed to send welcome email:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
        });
        if (!silent) {
          toast({
            title: "Welcome Email",
            description: "We couldn't send a welcome email, but your account is ready!",
            variant: "default",
          });
        }
        return false;
      }

      // Mark as sent in localStorage to avoid duplicates
      localStorage.setItem(emailSentKey, 'true');
      console.log('✅ Welcome email sent successfully and marked in localStorage');

      if (!silent) {
        toast({
          title: "Welcome Email Sent",
          description: "Please check your email (including spam folder) for a welcome email.",
        });
      }
      return true;
    } catch (error: any) {
      console.error('❌ Error sending welcome email:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      // Don't show error to user if silent mode
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to send welcome email, but your account is ready!",
          variant: "default",
        });
      }
      return false;
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setResendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await sendWelcomeEmailForUser(email, user.id, false);
      } else {
        throw new Error('User not found');
      }
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

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      // Use redirect-based OAuth flow (more reliable than popups)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to sign in with Facebook",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // User will be redirected to Facebook, then back to our app
      // Loading state will persist during redirect
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = authSchema.parse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });

      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) {
          if (error.message.includes("Invalid")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        // Check if email is verified after successful login
        if (data.user) {
          const provider = data.user.app_metadata?.provider || 'email';
          const isOAuthUser = provider === 'google' || provider === 'facebook';

          if (!isOAuthUser && !data.user.email_confirmed_at) {
            // Email not verified, redirect to verification required page
            toast({
              title: "Email Verification Required",
              description: "Please verify your email address to continue.",
              variant: "default",
            });
            navigate("/email-verification-required");
            return;
          }
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
      } else {
        // Set flag to indicate we're signing up (prevents listener from redirecting)
        setIsSigningUp(true);

        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: getPricingRedirectUrl(),
            data: {
              full_name: validatedData.fullName,
            },
          },
        });

        if (error) {
          setIsSigningUp(false); // Reset flag on error
          // Handle 422 error (usually SMTP/email configuration issue)
          if (error.status === 422 || error.code === "422") {
            toast({
              title: "Email Configuration Error",
              description: "Email verification is not properly configured. Please contact support or try signing in with an existing account.",
              variant: "destructive",
            });
            console.error("Signup error (422):", error);
            return;
          }

          // Handle email uniqueness errors
          if (error.message.includes("already registered") ||
            error.message.includes("already exists") ||
            error.message.includes("User already registered") ||
            error.code === "signup_disabled" ||
            error.message.toLowerCase().includes("email")) {
            toast({
              title: "Email Already Registered",
              description: "This email address is already registered. Please sign in instead or use a different email address.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        // Redirect to email verification sent page immediately after successful signup
        // This prevents the auth state change listener from redirecting to /pricing
        navigate("/email-verification-sent");

        // Get the user that was just created
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Send welcome/verification email via Edge Function
          // We send it even if user is already confirmed (when email confirmation is disabled)
          console.log('📧 Attempting to send welcome email for email/password signup...');
          console.log('User:', { id: user.id, email: user.email, confirmed: !!user.email_confirmed_at });

          // Use the helper function to send email
          const emailSent = await sendWelcomeEmailForUser(validatedData.email, user.id, false);

          // Don't show toast, user will be redirected to email verification page
          // The email verification page will show the message
        } else {
          // User not found, but still redirect to verification page
        }

        // Reset flag after a short delay to allow navigation
        setTimeout(() => setIsSigningUp(false), 1000);
      }
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
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-background">
        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {isLogin ? "Welcome back" : "Create Account"}
          </h1>
          <p className="text-white/70 mb-8 text-sm sm:text-base">
            {isLogin ? "Sign in to your account to continue" : "Start building your AI chat agent"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-white/90 mb-2 block">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary"
                />
              </div>
            )}

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
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/90 mb-2 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 pr-10 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="remember" className="text-white/90 text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:text-primary/80 text-sm transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-base"
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-4 text-white/60">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-white/90 text-gray-900 border-0 font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-white/90 text-gray-900 border-0 font-medium"
              onClick={handleFacebookSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary hover:text-primary/80 font-medium">Sign {isLogin ? "up" : "in"}</span>
            </button>
          </div>

          {!isLogin && email && (
            <div className="mt-4 text-center">
              <button
                onClick={handleResendVerificationEmail}
                disabled={resendingEmail}
                className="text-primary hover:text-primary/80 text-sm disabled:opacity-50 transition-colors"
              >
                {resendingEmail ? "Sending..." : "Didn't receive email? Resend verification"}
              </button>
            </div>
          )}
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
            Your data is protected with industry-standard encryption and security measures. Sign in with confidence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;