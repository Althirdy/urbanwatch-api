/**
 * Badge Styling Utilities
 * Centralized badge color schemes for consistent UI across the application
 * Follows DRY principle - all badge colors defined in one place
 */

// Base badge classes for consistent sizing
export const baseBadgeClasses = 'text-[10px] font-medium px-1.5 py-0.5';

/**
 * Status badge colors for active/inactive/suspended/archived states
 */
export const statusColors = {
    active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    inactive: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    archived: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    ongoing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
} as const;

/**
 * Role badge colors for user roles
 */
export const roleColors = {
    operator: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    admin: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    'purok leader': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    citizen: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
} as const;

/**
 * Responder type colors for emergency contacts
 */
export const responderTypeColors = {
    police: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    fire: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    medical: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    rescue: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    barangay: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    other: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
} as const;

/**
 * Report type colors for incident reports
 */
export const reportTypeColors = {
    fire: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    accident: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    medical: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    crime: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    other: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
} as const;

/**
 * Publication status colors for posts
 */
export const publicationStatusColors = {
    draft: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    scheduled: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    published: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
} as const;

/**
 * Suspension/Punishment badge colors
 */
export const suspensionColors = {
    warning1: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    warning2: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    permanent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    expired: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    revoked: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    active: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
} as const;

/**
 * Category badge colors
 */
export const categoryColors = {
    announcement: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    concern: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    accident: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
} as const;

// ============ UTILITY FUNCTIONS ============

/**
 * Get badge classes for user status
 */
export function getStatusBadgeClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || 'inactive';
    const colorClass = statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.inactive;
    return `${baseBadgeClasses} ${colorClass}`;
}

/**
 * Get badge classes for user role
 */
export function getRoleBadgeClass(role: string): string {
    const normalizedRole = role?.toLowerCase() || 'citizen';
    const colorClass = roleColors[normalizedRole as keyof typeof roleColors] || roleColors.citizen;
    return `${baseBadgeClasses} ${colorClass}`;
}

/**
 * Get badge classes for responder type
 */
export function getResponderTypeBadgeClass(type: string): string {
    const normalizedType = type?.toLowerCase() || 'other';
    const colorClass = responderTypeColors[normalizedType as keyof typeof responderTypeColors] || responderTypeColors.other;
    return `${baseBadgeClasses} ${colorClass}`;
}

/**
 * Get badge classes for report type
 */
export function getReportTypeBadgeClass(type: string): string {
    const normalizedType = type?.toLowerCase() || 'other';
    const colorClass = reportTypeColors[normalizedType as keyof typeof reportTypeColors] || reportTypeColors.other;
    return `${baseBadgeClasses} ${colorClass}`;
}

/**
 * Get badge classes for publication status
 */
export function getPublicationStatusBadgeClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || 'draft';
    const colorClass = publicationStatusColors[normalizedStatus as keyof typeof publicationStatusColors] || publicationStatusColors.draft;
    return `${baseBadgeClasses} ${colorClass}`;
}

/**
 * Get badge classes for suspension type/status
 */
export function getSuspensionBadgeClass(type: string, isActive: boolean = false): string {
    if (isActive) {
        return `${baseBadgeClasses} ${suspensionColors.active}`;
    }
    
    const normalizedType = type?.toLowerCase().replace('_', '') || 'expired';
    const typeMap: Record<string, keyof typeof suspensionColors> = {
        'warning1': 'warning1',
        'warning_1': 'warning1',
        'warning2': 'warning2',
        'warning_2': 'warning2',
        'suspension': 'permanent',
        'permanent': 'permanent',
        'expired': 'expired',
        'revoked': 'revoked',
    };
    
    const colorKey = typeMap[normalizedType] || 'expired';
    return `${baseBadgeClasses} ${suspensionColors[colorKey]}`;
}

/**
 * Get badge classes for category
 */
export function getCategoryBadgeClass(category: string): string {
    const normalizedCategory = category?.toLowerCase() || 'announcement';
    const colorClass = categoryColors[normalizedCategory as keyof typeof categoryColors] || categoryColors.announcement;
    return `${baseBadgeClasses} ${colorClass}`;
}

// ============ COLOR-ONLY UTILITIES (for custom badge sizes) ============

/**
 * Get only the color classes for status (without size classes)
 */
export function getStatusColorClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || 'inactive';
    return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.inactive;
}

/**
 * Get only the color classes for role (without size classes)
 */
export function getRoleColorClass(role: string): string {
    const normalizedRole = role?.toLowerCase() || 'citizen';
    return roleColors[normalizedRole as keyof typeof roleColors] || roleColors.citizen;
}

/**
 * Get only the color classes for responder type (without size classes)
 */
export function getResponderTypeColorClass(type: string): string {
    const normalizedType = type?.toLowerCase() || 'other';
    return responderTypeColors[normalizedType as keyof typeof responderTypeColors] || responderTypeColors.other;
}

/**
 * Get only the color classes for report type (without size classes)
 */
export function getReportTypeColorClass(type: string): string {
    const normalizedType = type?.toLowerCase() || 'other';
    return reportTypeColors[normalizedType as keyof typeof reportTypeColors] || reportTypeColors.other;
}

/**
 * Get only the color classes for publication status (without size classes)
 */
export function getPublicationStatusColorClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || 'draft';
    return publicationStatusColors[normalizedStatus as keyof typeof publicationStatusColors] || publicationStatusColors.draft;
}
