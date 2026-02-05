import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { locations } from '@/lib/packages';
import { users } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { LayoutGrid, Table } from 'lucide-react';
import { useState } from 'react';

import { roles_T } from '@/types/role-types';
import { PaginatedUsers, users_T } from '@/types/user-types';
import UserCard from './users-comp/users-card';
import CreateUsers from './users-comp/users-create';
import UserActionTab from './users-comp/users-tab';
import UserTable from './users-comp/users-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: users().url,
    },
];

export default function Users({
    users,
    roles,
    puroks,
}: {
    users: PaginatedUsers;
    roles: roles_T[];
    puroks: any[];
}) {
    const [filtered_users, setFilteredUsers] = useState<users_T[]>(users.data);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <CreateUsers roles={roles} puroks={puroks} />

                    {/* View Toggle */}
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'card')}>
                        <TabsList className="h-10 p-1">
                            <TabsTrigger
                                value="table"
                                className="h-7 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <Table className="h-3.5 w-3.5 mr-1.5" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="h-7 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                                Cards
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Filters */}
                <UserActionTab
                    users={users}
                    roles={roles}
                    setFilteredUsers={setFilteredUsers}
                />

                {/* Content */}
                {viewMode === 'table' ? (
                    <UserTable
                        users={filtered_users}
                        roles={roles}
                        puroks={puroks}
                    />
                ) : (
                    <UserCard
                        users={filtered_users}
                        roles={roles}
                        puroks={puroks}
                    />
                )}
            </div>
        </AppLayout>
    );
}
