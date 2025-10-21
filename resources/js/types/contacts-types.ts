import { Auth } from '@/types';

interface PageProps {
    auth: Auth;
}

export type Contact = {
    id: number;
    branch_unit_name: string;
    contact_person?: string;
    responder_type: string;
    location: string;
    primary_mobile: string;
    backup_mobile?: string;
    latitude?: number;
    longitude?: number;
    active: boolean;
    created_at: string;
    updated_at: string;
};

export type ContactsPageProps = PageProps & {
    contacts: {
        data: Contact[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links?: any[];
    };
    filters: {
        search?: string;
        responder_type?: string;
        active?: string;
    };
};
