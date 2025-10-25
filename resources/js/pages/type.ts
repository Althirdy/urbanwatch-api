export type paginated_T<T> = {
    current_page: number,
    first_page_url: string,
    data: T[],
    from: number,
    last_page_url: string,
    links: { url: string | null, label: string, active: boolean }[],
    next_page_url: string | null,
    path: string,
    per_page: number,
    prev_page_url: string | null,
    to: number,
    total: number,
}

export type cctv_T = {
    id: number,
    device_name: string,
    primary_rtsp_url: string,
    backup_rtsp_url: string | null,
    brand: string,
    installation_date: Date,
    location: location_T,
    model: string,
    resolution: string,
    status: string,
    fps: number,
}

export type uwDevice_T = {
    id: number,
    device_name: string,
    location_id: number | null,
    cctv_id: number | null,
    status: 'active' | 'inactive' | 'maintenance',
    custom_address: string | null,
    custom_latitude: number | null,
    custom_longitude: number | null,
    location?: location_T,
    cctv_device?: cctv_T,
    cctv_cameras?: cctv_T[], // Array of linked CCTV cameras
    latitude?: number | null, // Helper property for display (from location or custom)
    longitude?: number | null, // Helper property for display (from location or custom)
    created_at: string,
    updated_at: string,
}

export type location_T = {
    id: number,
    location_name: string,
    category_name?: string,
    landmark: string,
    barangay: string,
}