import { roles_T } from './role-types';

export type CitizenDetails = {
    id: number;
    user_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    date_of_birth?: string;
    phone_number?: string;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    is_verified: boolean;
    status: string;
    created_at: string;
    updated_at: string;
};

export type OfficialsDetails = {
    id: number;
    user_id: number;
    id_number?: string;
    purok_id?: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    contact_number?: string;
    office_address?: string;
    assigned_brgy?: string;
    latitude?: string;
    longitude?: string;
    status: string;
    created_at: string;
    updated_at: string;
    purok?: {
        id: number;
        name: string;
    };
};

export type users_T = {
    id: number;
    name: string;
    email: string;
    role_id: number;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    role?: roles_T;
    official_details?: OfficialsDetails;
    citizen_details?: CitizenDetails;
    status: string;
};

export type PaginatedUsers = {
    data: users_T[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
};

export type PunishmentOption = {
    type: string;
    label: string;
    duration: number | null;
    description: string;
};

export type SuspensionHistory = {
    id: number;
    punishment_type: string;
    duration_days: number | null;
    suspended_at: string;
    expires_at: string | null;
    status: string;
    reason: string | null;
    suspended_by: string;
    is_active: boolean;
};

export type AvailablePunishmentsData = {
    available_punishments: PunishmentOption[];
    suspension_history: SuspensionHistory[];
    is_suspended: boolean;
    active_suspension: {
        type: string;
        expires_at: string | null;
        reason: string | null;
    } | null;
};
