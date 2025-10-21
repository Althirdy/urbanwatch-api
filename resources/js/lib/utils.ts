import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a database timestamp to show relative time and absolute time
 * @param timestamp - ISO string timestamp from database
 * @returns formatted string like "2 minutes ago • 14:32 PM"
 */
export function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();

    // Get absolute time in 12-hour format
    const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // Calculate relative time
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    let relativeTime: string;

    if (diffInSeconds < 60) {
        relativeTime =
            diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} seconds ago`;
    } else if (diffInMinutes < 60) {
        relativeTime =
            diffInMinutes === 1
                ? '1 minute ago'
                : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        relativeTime =
            diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
        relativeTime =
            diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    } else if (diffInWeeks < 4) {
        relativeTime =
            diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
    } else if (diffInMonths < 12) {
        relativeTime =
            diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
    } else {
        relativeTime =
            diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
    }

    return `${relativeTime} • ${timeString}`;
}

export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${month}/${day}/${year} at ${hours}:${minutes}${ampm}`;
}

