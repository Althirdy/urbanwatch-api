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
    created_at: string;
    updated_at: string;
};

export type OfficialsDetails = {
    id: number;
    user_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    contact_number?: string;
    office_address?: string;
    latitude?: string;
    longitude?: string;
    created_at: string;
    updated_at: string;
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
    status?: string;
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
