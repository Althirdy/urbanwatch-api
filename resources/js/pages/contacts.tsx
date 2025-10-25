import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
import AddContacts from './contacts-comp/add-contacts';
import ViewContacts from './contacts-comp/view-contacts';
import EditContacts from './contacts-comp/edit-contacts';
import DeleteContacts from './contacts-comp/delete-contacts';
import { Auth, type BreadcrumbItem } from '@/types';
import { contacts } from '@/routes';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contacts',
        href: contacts().url,
    },
];

// Define PageProps interface
interface PageProps {
    auth: Auth;
}

// Type definitions based on backend structure
type Contact = {
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

type ContactsPageProps = PageProps & {
    contacts: {
        data: Contact[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        responder_type?: string;
        active?: string;
    };
};

export default function Contacts({ auth, contacts, filters }: ContactsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedType, setSelectedType] = useState(filters?.responder_type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.active !== undefined ? (filters.active === '1' ? 'Active' : 'Inactive') : '');
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const responderTypes = ['Fire', 'Emergency', 'Crime', 'Traffic', 'Barangay', 'Others'];
    const branchUnitNames = ['BEST', 'BCCM', 'BCPC', 'BDRRM', 'BHERT', 'BHW', 'BPSO', 'BTMO', 'VAWC'];
    const statusOptions = ['Active', 'Inactive'];

    // Filter contacts based on search term, type, and status - client-side filtering as fallback
    const filteredContacts = contacts?.data?.filter((contact: Contact) => {
        const matchesSearch = searchTerm === '' ||
            contact.branch_unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.contact_person && contact.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = selectedType === '' || contact.branch_unit_name === selectedType;
        const matchesStatus = selectedStatus === '' || 
            (selectedStatus === 'Active' && contact.active) ||
            (selectedStatus === 'Inactive' && !contact.active);
        
        return matchesSearch && matchesType && matchesStatus;
    }) || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header with Add Contact Button */}
                <div className="flex items-center justify-start">
                    <AddContacts />
                </div>

                {/* Search and Filters - Horizontal Layout */}
                <div className="flex flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search contact"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    {/* Type Filter - Working Dropdown */}
                    <div className="w-64 relative">
                        <button 
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap"
                        >
                            <span className={selectedType ? "text-foreground" : "text-muted-foreground"}>
                                {selectedType || "Select Branch/Unit Name"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                        </button>
                        {isTypeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-10">
                                <div 
                                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                                    onClick={() => {
                                        setSelectedType('');
                                        setIsTypeDropdownOpen(false);
                                    }}
                                >
                                    All Branch/Units
                                </div>
                                {branchUnitNames.map((type) => (
                                    <div
                                        key={type}
                                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                                        onClick={() => {
                                            setSelectedType(type);
                                            setIsTypeDropdownOpen(false);
                                        }}
                                    >
                                        {type}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Filter - Working Dropdown */}
                    <div className="w-48 relative">
                        <button 
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap"
                        >
                            <span className={selectedStatus ? "text-foreground" : "text-muted-foreground"}>
                                {selectedStatus || "Active"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                        </button>
                        {isStatusDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-10">
                                <div 
                                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                                    onClick={() => {
                                        setSelectedStatus('');
                                        setIsStatusDropdownOpen(false);
                                    }}
                                >
                                    All Status
                                </div>
                                {statusOptions.map((status) => (
                                    <div
                                        key={status}
                                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                                        onClick={() => {
                                            setSelectedStatus(status);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                    >
                                        {status}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contacts Table */}
                <div className="border rounded-lg overflow-hidden bg-card">
                    {/* Table Header */}
                    <div className="grid grid-cols-11 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
                        <div className="col-span-2">Branch/Unit Name</div>
                        <div className="col-span-2">Responder Type</div>
                        <div className="col-span-2">Primary Number</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {/* Table Body - Dynamic Data */}
                    <div className="divide-y">
                        {filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No contacts found matching your criteria.
                            </div>
                        ) : (
                            filteredContacts.map((contact: Contact) => (
                                <div key={contact.id} className="grid grid-cols-11 gap-4 p-4 hover:bg-muted/20 transition-colors">
                                    <div className="col-span-2 font-medium">
                                        {contact.branch_unit_name}
                                        {contact.contact_person && (
                                            <div className="text-sm text-muted-foreground">
                                                {contact.contact_person}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            contact.responder_type === 'Fire' ? 'bg-red-100 text-red-800' :
                                            contact.responder_type === 'Emergency' ? 'bg-orange-100 text-orange-800' :
                                            contact.responder_type === 'Crime' ? 'bg-purple-100 text-purple-800' :
                                            contact.responder_type === 'Traffic' ? 'bg-yellow-100 text-yellow-800' :
                                            contact.responder_type === 'Barangay' ? 'bg-green-100 text-green-800' :
                                            contact.responder_type === 'Others' ? 'bg-gray-100 text-gray-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {contact.responder_type}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        {contact.primary_mobile}
                                        {contact.backup_mobile && (
                                            <div className="text-sm text-muted-foreground">
                                                Backup: {contact.backup_mobile}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="font-medium">{contact.location}</div>
                                        {contact.latitude && contact.longitude && (
                                            <div className="text-sm text-muted-foreground">
                                                {Number(contact.latitude).toFixed(2)}, {Number(contact.longitude).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            contact.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            ● {contact.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center gap-0">
                                        <ViewContacts contact={contact} />
                                        <EditContacts contact={contact} />
                                        <DeleteContacts contact={contact} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer with results count */}
                <div className="text-sm text-muted-foreground">
                    Showing {filteredContacts.length} of {contacts?.total || 0} Contacts
                </div>
            </div>
        </AppLayout>
    );
}