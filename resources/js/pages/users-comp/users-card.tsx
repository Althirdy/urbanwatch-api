import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Archive, BadgeAlert, ExternalLink, KeyRound, Mail, MapPin, SquarePen, User } from 'lucide-react';

import { baseBadgeClasses, getRoleColorClass, getStatusColorClass } from '@/lib/badgeStyles';
import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import OperatorDetails from './operator-details';
import SuspensionUser from './users-suspension';
import ViewUser from './users-view';

const UserCard = ({
    users,
    roles,
    puroks = [],
}: {
    users: users_T[];
    roles: roles_T[];
    puroks?: any[];
}) => {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    // Filter out the current logged-in user
    const filteredUsers = users.filter((user) => user.id !== currentUserId);

    // Get user's full name
    const getFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name || ''} ${user.official_details.last_name}`.trim();
        }
        if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name || ''} ${user.citizen_details.last_name}`.trim();
        }
        return user.name;
    };

    // Get user's barangay or Purok
    const getBarangay = (user: users_T) => {
        if (user.official_details?.purok?.name) {
            return `Purok: ${user.official_details.purok.name}`;
        }
        return user.citizen_details?.barangay || user.official_details?.assigned_brgy || 'N/A';
    };

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-foreground">No users found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {filteredUsers.map((user) => (
                <Card
                    key={user.id}
                    className="group relative py-4 overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700 h-full"
                >
                    <CardContent className="p-4 flex flex-col h-full">
                        {/* Header Row */}
                        <div className='flex flex-row gap-2 items-center px-2 mb-4'>
                            <div className="flex items-center justify-center gap-2  bg-zinc-100 dark:bg-zinc-800">
                                <User className="h-auto  w-8 shrink-0  text-zinc-600 dark:text-zinc-400" />

                            </div>
                            <div className='flex flex-col gap-1'>
                                <h3 className="truncate text-sm font-semibold leading-tight">
                                    {getFullName(user)}
                                </h3>
                                <div className='flex  gap-2 items-center'>

                                    <Badge
                                        variant="outline"
                                        className={`${baseBadgeClasses} ${getRoleColorClass(user.role?.name || '')}`}
                                    >
                                        {user.role?.name || 'N/A'}
                                    </Badge>
                                    {user.role?.name?.toLowerCase() !== 'citizen' && (
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 ${baseBadgeClasses} capitalize ${getStatusColorClass(user.official_details?.status || user.citizen_details?.status || 'inactive')}`}
                                        >
                                            {user.official_details?.status || user.citizen_details?.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* User Info - Compact */}
                        <div className="space-y-2 mb-2 flex-grow">
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-2 border border-zinc-100 dark:border-zinc-800/80">
                                <MapPin className="h-4 w-auto text-muted-foreground shrink-0" />
                                <span className="truncate text-sm text-zinc-600 dark:text-zinc-400 font-medium ">
                                    {getBarangay(user)}</span>
                            </div>
                            {/* Email */}
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-2 border border-zinc-100 dark:border-zinc-800/80">
                                <Mail className="h-4 w-auto text-muted-foreground shrink-0" />
                                <span className="truncate text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                    {user.email}
                                </span>
                            </div>

                        </div>

                        {/* Action Buttons - Premium Footer */}
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 mt-auto dark:border-zinc-800">
                            <Tooltip>
                                <ViewUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                                    <EditUser user={user} roles={roles} puroks={puroks}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditUser>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Edit Account</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {user.role?.name?.toLowerCase() === 'operator' && (
                                <Tooltip>
                                    <OperatorDetails user={user}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                                            >
                                                <BadgeAlert className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </SuspensionUser>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Suspend Account</p>
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
                                        >
                                            <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                        </Button>
                                    </TooltipTrigger>
                                </ArchiveUser>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>Archive Account</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardContent>
                </Card>
            ))
            }
        </div >
    );
};

export default UserCard;
