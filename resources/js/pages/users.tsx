import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { users } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { List, Table } from 'lucide-react';
import { useState } from 'react';

import { roles_T } from '@/types/role-types';
import { PaginatedUsers, users_T } from '@/types/user-types';
import CreateUsers from './users-comp/create-users';
import UserCard from './users-comp/user-card';
import UserTable from './users-comp/user-table';
import UserActionTab from './users-comp/users-tab';

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

                <Tabs defaultValue="table" className="w-full space-y-4">
                    <div className="flex flex-row gap-4">
                        <UserActionTab
                            users={users}
                            roles={roles}
                            setFilteredUsers={setFilteredUsers}
                        />
                        <TabsList className="h-12 w-24">
                            <TabsTrigger value="table">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <List className="h-8 w-8" />
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        <p>Table view</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TabsTrigger>
                            <TabsTrigger value="card">
                                <Table className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="table" className="w-full">
                        <UserTable users={filtered_users} roles={roles} />
                    </TabsContent>
                    <TabsContent value="card" className="w-full">
                        <UserCard users={filtered_users} roles={roles} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
