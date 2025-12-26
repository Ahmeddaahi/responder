import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseEmailVerificationReturn {
  isVerified: boolean;
  isLoading: boolean;
  user: User | null;
  isOAuthUser: boolean;
}

/**
 * Custom hook to check if the current user's email is verified.
 * OAuth users (Google/Facebook) are automatically verified.
 * Email/password users must have email_confirmed_at set.
 */
export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsVerified(false);
          setUser(null);
          setIsOAuthUser(false);
          setIsLoading(false);
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Check the authentication provider
        const provider = currentUser.app_metadata?.provider || 'email';
        const isOAuth = provider === 'google' || provider === 'facebook';
        setIsOAuthUser(isOAuth);

        // OAuth users are automatically verified
        if (isOAuth) {
          setIsVerified(true);
        } else {
          // Email/password users must have email_confirmed_at
          setIsVerified(!!currentUser.email_confirmed_at);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);

        const provider = currentUser.app_metadata?.provider || 'email';
        const isOAuth = provider === 'google' || provider === 'facebook';
        setIsOAuthUser(isOAuth);

        if (isOAuth) {
          setIsVerified(true);
        } else {
          setIsVerified(!!currentUser.email_confirmed_at);
        }
      } else {
        setUser(null);
        setIsVerified(false);
        setIsOAuthUser(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isVerified, isLoading, user, isOAuthUser };
};

