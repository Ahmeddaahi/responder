import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that ensures users have verified their email
 * and completed onboarding before accessing protected routes.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isVerified, isLoading, user, isOAuthUser } = useEmailVerification();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for loading to complete
      if (isLoading || isProfileLoading) return;

      // If no user, redirect to auth
      if (!user) {
        navigate("/auth");
        return;
      }

      // Email/password users must be verified
      if (!isOAuthUser && !isVerified) {
        navigate("/email-verification-required");
        return;
      }

      // If verified and onboarding is not completed, and we are not already on the onboarding page
      if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
        navigate("/onboarding");
        return;
      }
    };

    checkAccess();
  }, [isLoading, isVerified, user, isOAuthUser, navigate, profile, isProfileLoading, location.pathname]);

  // Show loading state while checking
  if (isLoading || (user && isProfileLoading)) {
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

  // If profile exists and onboarding is not completed, don't render children unless on onboarding page
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return null;
  }

  // User is verified, allow access
  return <>{children}</>;
};

