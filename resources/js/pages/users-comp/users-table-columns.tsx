import { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowUpDown,
    BadgeAlert,
    ExternalLink,
    KeyRound,
    SquarePen,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { baseBadgeClasses, getRoleColorClass, getStatusColorClass } from '@/lib/badgeStyles';
import { cn } from '@/lib/utils';

import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import OperatorDetails from './operator-details';
import SuspensionUser from './users-suspension';
import ViewUser from './users-view';

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
    puroks: any[] = [],
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
                        className="cursor-pointer text-sm transition-colors duration-200 ease-in-out"
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

                return (
                    <Badge
                        variant="outline"
                        className={`${baseBadgeClasses} ${getRoleColorClass(roleName)}`}
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
                if (user.official_details?.purok?.name) {
                    return <div>Purok: {user.official_details.purok.name}</div>;
                }
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

                if (user.role?.name?.toLowerCase() === 'citizen') {
                    return null;
                }

                const statusText = user.official_details?.status || user.citizen_details?.status || 'active';

                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            baseBadgeClasses,
                            "capitalize",
                            getStatusColorClass(statusText)
                        )}
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
                    <div className="flex justify-center gap-1.5">
                        <Tooltip>
                            <ViewUser user={user}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                    </Button>
                                </TooltipTrigger>
                            </ViewUser>
                            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                <p>View Details</p>
                            </TooltipContent>
                        </Tooltip>
                        {/* Edit button only for Purok Leader */}
                        {user.role?.name?.toLowerCase() === 'purok leader' && (
                            <Tooltip>
                                <EditUser
                                    user={user}
                                    roles={roles}
                                    puroks={puroks}
                                >
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </EditUser>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>Edit User</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {/* Operator Details button for Operators */}
                        {user.role?.name?.toLowerCase() === 'operator' && (
                            <Tooltip>
                                <OperatorDetails user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <KeyRound className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </OperatorDetails>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>Manage Password</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {user.role?.name?.toLowerCase() === 'citizen' && (
                            <Tooltip>
                                <SuspensionUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <BadgeAlert className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </SuspensionUser>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>Suspend User</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <ArchiveUser user={user}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                    </Button>
                                </TooltipTrigger>
                            </ArchiveUser>
                            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                <p>Archive User</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];
