import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that ensures users have verified their email
 * before accessing protected routes. OAuth users are automatically allowed.
 * Email/password users must have verified their email.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isVerified, isLoading, user, isOAuthUser } = useEmailVerification();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for loading to complete
      if (isLoading) return;

      // If no user, redirect to auth
      if (!user) {
        navigate("/auth");
        return;
      }

      // OAuth users are automatically verified, allow access
      if (isOAuthUser) {
        return;
      }

      // Email/password users must be verified
      if (!isVerified) {
        navigate("/email-verification-required");
        return;
      }
    };

    checkAccess();
  }, [isLoading, isVerified, user, isOAuthUser, navigate]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render children (will redirect)
  if (!user) {
    return null;
  }

  // If email/password user and not verified, don't render children (will redirect)
  if (!isOAuthUser && !isVerified) {
    return null;
  }

  // User is verified or OAuth user, allow access
  return <>{children}</>;
};

