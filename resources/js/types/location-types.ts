export type LocationCategory_T = {
    id: number;
    name: string;
};

export type location_T = {
    id: number;
    location_name: string;
    landmark: string;
    barangay: string;
    longitude: string;
    latitude: string;
    description?: string;
    cctv_count?: number;
    cameras?: number;
    category?: LocationCategory_T;
};
