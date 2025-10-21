import { users_T } from './user-types';

export type reports_T = {
    id: number;
    user_id: number;
    report_type: string;
    transcript: string;
    description: string;
    latitute: string;
    longtitude: string;
    is_acknowledge: boolean;
    acknowledge_by?: number;
    user?: users_T;
    acknowledgedBy?: users_T;
    status: string;
    created_at: string;
    updated_at: string;
};

export type ReportsProps = {
    reports: {
        data: reports_T[];
        links: any[];
        meta: any;
        current_page?: number;
        last_page?: number;
    };
    pendingReports?: reports_T[];
    filters: {
        search?: string;
        report_type?: string;
        acknowledged?: string;
    };
    reportTypes: string[];
    statusOptions: { value: string; label: string }[];
};

export type EditReportProps = {
    report: reports_T;
    reportTypes: string[];
    children: React.ReactNode;
};

export type EditReportForm = {
    report_type: string;
    description: string;
    transcript: string;
    latitute: string;
    longtitude: string;
    is_acknowledge: boolean;
};
