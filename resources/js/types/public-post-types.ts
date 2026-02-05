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
    latitude: string;
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
    title: string;
    content: string;
    image_path: string | null;
    category: string;
    postable_id: number | null;
    postable_type: string | null;
    published_by: number;
    published_at: string | null;
    status: 'draft' | 'published' | 'scheduled';
    computed_status?: 'draft' | 'published' | 'scheduled';
    created_at: string;
    updated_at: string;
    report?: Report_T;
    deleted_at?: string;
    postable?: {
        id: number;
        status: 'pending' | 'ongoing' | 'resolved' | 'archived';
        accident_type?: string;
        [key: string]: any;
    };
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
