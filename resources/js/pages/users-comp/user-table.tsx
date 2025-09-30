import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import ArchiveUser from './archive-user';
import EditUser from './edit-users';
import ViewUser from './view-user';

const UserTable = ({
    users,
    roles,
}: {
    users: users_T[];
    roles: roles_T[];
}) => {
    return (
        <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--sidebar)]">
            <Table className="m-0 border">
                <TableCaption className="m-0 border-t py-4">
                    Showing {users.length} Users
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="border-r py-4 text-center font-semibold"></TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Name
                        </TableHead>

                        <TableHead className="border-r py-4 text-center font-semibold">
                            Role
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Assigned Barangay
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Status
                        </TableHead>
                        <TableHead className="py-4 text-center font-semibold">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow
                            key={user.id}
                            className="text-center text-muted-foreground"
                        >
                            <TableCell className="py-3"></TableCell>
                            <TableCell className="py-3">{user.name}</TableCell>

                            <TableCell className="py-3">
                                {user.role ? user.role.name : 'N/A'}
                            </TableCell>

                            <TableCell className="py-3">
                                {user.citizen_details?.barangay || 'N/A'}
                            </TableCell>
                            <TableCell className="py-3">
                                {user.status
                                    ? user.status.toLocaleUpperCase()
                                    : 'ACTIVE'}
                            </TableCell>
                            <TableCell className="py-3">
                                <div className="flex justify-center gap-2">
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default UserTable;
