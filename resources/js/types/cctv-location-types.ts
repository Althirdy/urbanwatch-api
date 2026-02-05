export type paginated_T<T> = {
    current_page: number;
    first_page_url: string;
    data: T[];
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
};

export type cctv_T = {
    id: number;
    location_name: string;
    package: string | null;
    latitude: string | null;
    longitude: string | null;
    primary_rtsp_url: string;
    backup_rtsp_url: string | null;
    rtsp_username: string | null;
    installation_date: Date;
    status: string;
    yolo_enabled: boolean;
};

export type uwDevice_T = {
    id: number;
    device_id: string;
    device_name: string;
    status: 'active' | 'inactive' | 'maintenance';
    custom_address: string | null;
    custom_latitude: number | null;
    custom_longitude: number | null;
    api_token?: string;
    last_seen_at?: string | null;
    is_online?: boolean;
    anomaly_count?: number;
    latitude?: number | null; // Helper property for display
    longitude?: number | null; // Helper property for display
    display_location?: string;
    location?: {
        location_name: string;
        barangay: string;
        landmark: string;
    };
    cctv_cameras?: any[];
    created_at: string;
    updated_at: string;
};

export type location_T = {
    id: number;
    name: string;
};
