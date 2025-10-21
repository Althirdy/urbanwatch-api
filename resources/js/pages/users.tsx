import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { users } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { List, Table } from 'lucide-react';
import { useState } from 'react';

import { roles_T } from '@/types/role-types';
import { PaginatedUsers, users_T } from '@/types/user-types';
import UserCard from './users-comp/users-card';
import CreateUsers from './users-comp/users-create';
import UserActionTab from './users-comp/users-tab';
import UserTable from './users-comp/users-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: users().url,
    },
];

export default function Users({
    users,
    roles,
}: {
    users: PaginatedUsers;
    roles: roles_T[];
}) {
    const [filtered_users, setFilteredUsers] = useState<users_T[]>(users.data);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-4">
                <CreateUsers roles={roles} />

                <Tabs defaultValue="table" className="w-full space-y-2">
                    <div className="flex flex-row gap-4">
                        <UserActionTab
                            users={users}
                            roles={roles}
                            setFilteredUsers={setFilteredUsers}
                        />
                        <TabsList className="h-12 w-24">
                            <TabsTrigger
                                value="table"
                                className="cursor-pointer"
                            >
                                <List className="h-8 w-8" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="cursor-pointer"
                            >
                                <Table className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="table" className="w-full">
                        <UserTable
                            users={filtered_users}
                            roles={roles}
                            links={users.links}
                            currentPage={users.current_page}
                            lastPage={users.last_page}
                        />
                    </TabsContent>
                    <TabsContent value="card" className="w-full">
                        <UserCard users={filtered_users} roles={roles} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
