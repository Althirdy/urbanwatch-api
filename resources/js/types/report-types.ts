import { users_T } from './user-types';

export type reports_T = {
    id: number;
    user_id: number;
    report_type: string;
    transcript: string;
    description: string;
    latitude: string;
    longitude: string;
    location_name?: string | null;
    is_acknowledge: boolean;
    acknowledge_by?: number;
    user?: users_T;
    acknowledgedBy?: users_T;
    status: string;
    created_at: string;
    updated_at: string;
    media?: string[]; // Array of image URLs
};

export type ReportsProps = {
    reports: {
        data: reports_T[];
        links: any[];
        meta: any;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: {
        search?: string;
        report_type?: string;
        acknowledged?: string;
    };
    reportTypes: string[];
};
