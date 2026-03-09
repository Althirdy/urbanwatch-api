import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { contacts } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Contact, ContactsPageProps } from '@/types/contacts-types';
import { Head } from '@inertiajs/react';
import { LayoutGrid, Table } from 'lucide-react';
import { useState } from 'react';
import AddContacts from './contacts-comp/contacts-create';
import ContactCard from './contacts-comp/contacts-card';
import ContactActionTab from './contacts-comp/contacts-tab';
import ContactTable from './contacts-comp/contacts-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contacts',
        href: contacts().url,
    },
];

export default function Contacts({
    contacts,
}: ContactsPageProps) {
    const [filtered_contacts, setFilteredContacts] = useState<Contact[]>(
        contacts?.data || [],
    );
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />

            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <AddContacts />

                    {/* View Toggle */}
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'card')}>
                        <TabsList className="h-9 p-1">
                            <TabsTrigger
                                value="table"
                                className="h-8 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <Table className="h-3.5 w-3.5 mr-1.5" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="h-8 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                                Cards
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Filters */}
                <ContactActionTab
                    contacts={contacts}
                    setFilteredContacts={setFilteredContacts}
                />

                {/* Content */}
                {viewMode === 'table' ? (
                    <ContactTable contacts={filtered_contacts} />
                ) : (
                    <ContactCard contacts={filtered_contacts} />
                )}
            </div>
        </AppLayout>
    );
}
