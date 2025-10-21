import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import ViewUser from './users-view';

const UserCard = ({ users, roles }: { users: users_T[]; roles: roles_T[] }) => {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {users.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center rounded-[var(--radius)] border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        No users found at the moment
                    </p>
                </div>
            )}

            {/* Use filtered_roles for displaying cards */}
            {users.map((user) => (
                <Card
                    key={user.id}
                    className="relative overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                >
                    <CardHeader>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">
                                Role & Location
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                                {user.role ? user.role.name : 'N/A'} at{' '}
                                {user.citizen_details?.barangay ||
                                    user.official_details?.assigned_brgy ||
                                    'N/A'}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex w-full justify-end gap-2">
                            <Tooltip>
                                <ViewUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                        >
                                            <Open className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </ViewUser>
                                <TooltipContent>
                                    <p>View Details</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <EditUser user={user} roles={roles}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                        >
                                            <SquarePen className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </EditUser>
                                <TooltipContent>
                                    <p>Edit User</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <ArchiveUser user={user}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
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
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default UserCard;
