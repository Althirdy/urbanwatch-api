export type AiLogTab = 'yolo' | 'concerns';

export type YoloFalseAlarmLog = {
    id: number;
    cctv_device_id: number;
    device_name: string;
    location_name: string;
    attempted_accident_type: string | null;
    gemini_reasoning: string;
    confidence_score: number | string | null;
    detected_objects: unknown[] | null;
    gemini_metadata: Record<string, unknown> | null;
    detected_at: string | null;
    created_at: string;
};

export type ConcernFalseAlarmLog = {
    id: number;
    tracking_code: string;
    citizen_id: number;
    citizen_name: string | null;
    title: string;
    description: string;
    transcript_text: string | null;
    status: string;
    is_valid: boolean | null;
    category: string | null;
    specific_type: string | null;
    severity: string | null;
    rejection_reason: string | null;
    ai_category: string | null;
    ai_severity: string | null;
    ai_confidence: number | string | null;
    coherence_score: number | string | null;
    detail_score: number | string | null;
    ai_processed_at: string | null;
    ai_analysis_raw: Record<string, unknown> | null;
    rejection_source: 'official' | 'ai_model';
    created_at: string;
};

export type AiLogsFilters = {
    tab?: AiLogTab;
    search?: string;
    date_from?: string;
    date_to?: string;
    device_id?: string;
    attempted_type?: string;
    rejection_source?: string;
    category?: string;
    per_page?: string | number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
};

export type AiLogsPageProps = {
    activeTab: AiLogTab;
    logs: {
        data: Array<YoloFalseAlarmLog | ConcernFalseAlarmLog>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        prev_page_url: string | null;
        next_page_url: string | null;
        current_page: number;
        last_page: number;
        per_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: AiLogsFilters;
    options: {
        devices: Array<{ id: number; name: string }>;
        attemptedTypes: string[];
        concernCategories: string[];
    };
};
