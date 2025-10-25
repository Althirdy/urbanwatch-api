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
import ArchiveUser from './users-archive';
import EditUser from './users-edit';
import ViewUser from './users-view';

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
                        <TableHead className="border-r py-4 text-center font-semibold">
                            User ID
                        </TableHead>
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
                            <TableCell className="py-3">#{user.id}</TableCell>
                            <TableCell className="py-3">{user.name}</TableCell>

                            <TableCell className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.role?.name === 'Operator' ? 'bg-blue-100 text-blue-800' :
                                    user.role?.name === 'Citizen' ? 'bg-purple-100 text-purple-800' :
                                    user.role?.name === 'Purok Leader' ? 'bg-green-100 text-green-800' :
                                    user.role?.name === 'Admin' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {user.role ? user.role.name : 'N/A'}
                                </span>
                            </TableCell>

                            <TableCell className="py-3">
                                {user.citizen_details?.barangay ||
                                    user.official_details?.assigned_brgy ||
                                    'N/A'}
                            </TableCell>
                            <TableCell className="py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    (user.citizen_details?.status || user.official_details?.status || 'ACTIVE').toLocaleUpperCase() === 'ACTIVE' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    ● {(
                                        user.citizen_details?.status ||
                                        user.official_details?.status ||
                                        'ACTIVE'
                                    ).toLocaleUpperCase()}
                                </span>
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
