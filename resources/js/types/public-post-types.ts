export type User_T = {
    id: number;
    name: string;
    email: string;
    role_id: number;
    created_at: string;
    updated_at: string;
};

export type Report_T = {
    id: number;
    user_id: number;
    report_type: string;
    transcript: string;
    description: string;
    latitute: string;
    longtitude: string;
    is_acknowledge: boolean;
    acknowledge_by: number | null;
    status: string;
    created_at: string;
    updated_at: string;
    user: User_T;
};

export type PublicPost_T = {
    id: number;
    report_id: number;
    published_by: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    report: Report_T;
    publishedBy: User_T;
};

export type PublicPostsResponse_T = {
    current_page: number;
    data: PublicPost_T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
};

// Legacy type for backward compatibility
export type public_posts_T = PublicPostsResponse_T;
