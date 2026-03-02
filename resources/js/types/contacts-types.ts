import { Auth } from '@/types';

// Core Contact type
export type Contact = {
    id: number;
    branch_unit_name: string;
    contact_person?: string;
    responder_type: string;
    primary_mobile: string;
    backup_mobile?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
};

// Paginated contacts response
export type PaginatedContacts = {
    data: Contact[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

// Page props
export interface PageProps {
    auth: Auth;
}

export type ContactsPageProps = PageProps & {
    contacts: PaginatedContacts;
    responseUnits: BranchUnitName[];
    responderTypes: ResponderType[];
    filters: {
        search?: string;
        responder_type?: string;
        active?: string;
    };
};

// Dropdown option types
export type ResponderType = {
    id: number;
    name: string;
};

export type BranchUnitName = {
    id: number;
    name: string;
};

// Selection state for dropdowns
export type SelectionState = {
    value: ResponderType | BranchUnitName | null;
    open: boolean;
};
