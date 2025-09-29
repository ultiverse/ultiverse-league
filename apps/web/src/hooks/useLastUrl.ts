import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigationStorage } from '@/utils/localStorage';

/**
 * Hook to manage URL persistence
 * Saves the current URL and can restore the last visited URL
 */
export function useLastUrl() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current URL whenever location changes
  useEffect(() => {
    const currentUrl = location.pathname + location.search;
    // Only save meaningful URLs (not root redirect)
    if (currentUrl !== '/') {
      navigationStorage.saveLastUrl(currentUrl);
    }
  }, [location]);

  /**
   * Navigate to the last saved URL or fallback to a default
   */
  const navigateToLastUrl = (fallbackUrl: string = '/teams') => {
    const lastUrl = navigationStorage.loadLastUrl();
    navigate(lastUrl || fallbackUrl);
  };

  /**
   * Get the last saved URL without navigating
   */
  const getLastUrl = (): string | null => {
    return navigationStorage.loadLastUrl();
  };

  /**
   * Clear the saved URL
   */
  const clearLastUrl = () => {
    navigationStorage.clearLastUrl();
  };

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

  const redirectToLastUrl = () => {
    const lastUrl = navigationStorage.loadLastUrl();
    if (lastUrl && lastUrl !== '/') {
      navigate(lastUrl, { replace: true });
      return true; // Indicates a redirect happened
    }
    return false; // No redirect
  };

  return { redirectToLastUrl };
}