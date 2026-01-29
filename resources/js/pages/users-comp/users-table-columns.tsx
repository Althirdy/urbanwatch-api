import { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowUpDown,
    BadgeAlert,
    ExternalLink,
    SquarePen,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { location_T } from '@/types/location-types';
import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import SuspensionUser from './users-suspension';
import ViewUser from './users-view';

const roleColors: Record<string, string> = {
    Operator: 'bg-green-800',
    Citizen: 'bg-orange-500',
    'Purok Leader': 'bg-blue-500',
    Admin: 'bg-red-500',
};

const getFullName = (user: users_T) => {
    if (user.official_details) {
        return `${user.official_details.first_name} ${user.official_details.middle_name || ''} ${user.official_details.last_name}`.trim();
    }
    if (user.citizen_details) {
        return `${user.citizen_details.first_name} ${user.citizen_details.middle_name || ''} ${user.citizen_details.last_name}`.trim();
    }
    return user.name;
};

export const columns = (
    roles: roles_T[],
    locations: location_T[],
): ColumnDef<users_T>[] => [
    {
        accessorKey: 'id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    User ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>#{row.getValue('id')}</div>,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>{getFullName(row.original)}</div>,
    },
    {
        accessorKey: 'role.name',
        header: 'Role',
        cell: ({ row }) => {
            const user = row.original;
            const roleName = user.role?.name || 'N/A';
            const bgColor = roleColors[roleName] || 'bg-gray-500';

            return (
                <Badge
                    className={`inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium text-foreground ${bgColor}`}
                >
                    {roleName}
                </Badge>
            );
        },
    },
    {
        id: 'location',
        header: 'Assigned Location',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div>
                    {user.citizen_details?.barangay ||
                        user.official_details?.assigned_brgy ||
                        'N/A'}
                </div>
            );
        },
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const user = row.original;
            const status =
                user.citizen_details?.status ||
                user.official_details?.status ||
                'Active';
            const statusText =
                status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

            return (
                <Badge
                    className={`inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium text-foreground ${
                        statusText === 'Active'
                            ? 'bg-green-800 dark:bg-green-900'
                            : 'bg-zinc-700'
                    }`}
                >
                    {statusText}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
            const user = row.original;

            return (
                <div className="flex justify-center gap-2">
                    <Tooltip>
                        <ViewUser user={user}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </ViewUser>
                        <TooltipContent>
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    {user.role?.name?.toLowerCase() !== 'citizen' && (
                        <Tooltip>
                            <EditUser
                                user={user}
                                roles={roles}
                                locations={locations}
                            >
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <SquarePen className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                            </EditUser>
                            <TooltipContent>
                                <p>Edit User</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <SuspensionUser user={user}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <BadgeAlert className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </SuspensionUser>
                        <TooltipContent>
                            <p>Suspend User</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <ArchiveUser user={user}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Archive className="h-4 w-4 text-[var(--destructive)]" />
                                </Button>
                            </TooltipTrigger>
                        </ArchiveUser>
                        <TooltipContent>
                            <p>Archive User</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
