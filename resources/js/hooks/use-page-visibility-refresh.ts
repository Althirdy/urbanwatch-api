import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Custom hook that refreshes the current page data when the browser tab
 * becomes visible again. This prevents stale data from being shown when
 * users switch between tabs.
 */
export function usePageVisibilityRefresh() {
    const lastVisibilityChange = useRef<number>(Date.now());

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                // Only refresh if more than 2 seconds have passed since last visibility change
                // This prevents excessive refreshes during rapid tab switches
                if (now - lastVisibilityChange.current > 2000) {
                    router.reload({ only: [], preserveScroll: true });
                }
                lastVisibilityChange.current = now;
            }
        };

        // Handle bfcache restoration (back/forward cache)
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // Page was restored from bfcache, refresh data
                router.reload({ only: [], preserveScroll: true });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);
}
