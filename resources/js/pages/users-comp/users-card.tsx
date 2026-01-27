import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Archive, ExternalLink, Mail, MapPin, Settings, User } from 'lucide-react';

import { location_T } from '@/types/location-types';
import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import ViewUser from './users-view';

// Role badge styles
const getRoleBadgeStyles = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
        case 'operator':
            return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30';
        case 'citizen':
            return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30';
        case 'purok leader':
            return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/30';
        case 'admin':
            return 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
        default:
            return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
    }
};

// Status badge styles
const getStatusBadgeStyles = (status?: string) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30';
        case 'inactive':
            return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
        case 'suspended':
            return 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
        default:
            return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
    }
};

const UserCard = ({
    users,
    roles,
    locations,
}: {
    users: users_T[];
    roles: roles_T[];
    locations: location_T[];
}) => {
    console.log("users in card:", users);
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

    // Get user's barangay
    const getBarangay = (user: users_T) => {
        return user.citizen_details?.barangay || user.official_details?.assigned_brgy || 'N/A';
    };

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-foreground">No users found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {users.map((user) => (
                <Card
                    key={user.id}
                    className="group relative overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                    <CardContent className="p-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                                    <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold leading-tight">
                                        {getFullName(user)}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{getBarangay(user)}</span>
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 capitalize ${getStatusBadgeStyles(user.status)}`}
                            >
                                {user.status || 'N/A'}
                            </Badge>
                        </div>

                        {/* User Info - Compact */}
                        <div className="space-y-2 mb-3 text-xs">
                            {/* Email */}
                            <div className="flex items-center gap-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>

                            {/* Role */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Role</span>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] font-medium px-1.5 py-0.5 ${getRoleBadgeStyles(user.role?.name)}`}
                                >
                                    {user.role?.name || 'N/A'}
                                </Badge>
                            </div>
                        </div>

                        {/* Action Buttons - Compact */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t dark:border-zinc-800">
                            <Tooltip>
                                <ViewUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                </ViewUser>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">View Details</p>
                                </TooltipContent>
                            </Tooltip>
                            {user.role?.name?.toLowerCase() !== 'citizen' && (
                                <Tooltip>
                                    <EditUser user={user} roles={roles} locations={locations}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditUser>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">Edit User</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            <Tooltip>
                                <ArchiveUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            <Archive className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </ArchiveUser>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">Archive User</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default UserCard;
