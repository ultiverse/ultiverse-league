import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStorage } from './useNavigationStorage';

/**
 * Hook to manage URL persistence
 * Saves the current URL and can restore the last visited URL
 */
export function useLastUrl() {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveLastUrl, loadLastUrl, clearLastUrl } = useNavigationStorage();

  // Save current URL whenever location changes
  useEffect(() => {
    const currentUrl = location.pathname + location.search;
    // Only save meaningful URLs (not root redirect)
    if (currentUrl !== '/') {
      saveLastUrl(currentUrl);
    }
  }, [location, saveLastUrl]);

  /**
   * Navigate to the last saved URL or fallback to a default
   */
  const navigateToLastUrl = useCallback((fallbackUrl: string = '/teams') => {
    const lastUrl = loadLastUrl();
    navigate(lastUrl || fallbackUrl);
  }, [loadLastUrl, navigate]);

  /**
   * Get the last saved URL without navigating
   */
  const getLastUrl = useCallback((): string | null => {
    return loadLastUrl();
  }, [loadLastUrl]);

  return {
    navigateToLastUrl,
    getLastUrl,
    clearLastUrl,
  };
}

/**
 * Hook specifically for initial app load redirect
 * Use this in App.tsx to redirect users to their last location
 */
export function useInitialRedirect() {
  const navigate = useNavigate();
  const { loadLastUrl } = useNavigationStorage();

  const redirectToLastUrl = useCallback(() => {
    const lastUrl = loadLastUrl();
    if (lastUrl && lastUrl !== '/') {
      navigate(lastUrl, { replace: true });
      return true; // Indicates a redirect happened
    }
    return false; // No redirect
  }, [loadLastUrl, navigate]);

  return { redirectToLastUrl };
}