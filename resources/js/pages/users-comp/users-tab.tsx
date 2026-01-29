import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { roles_T } from '@/types/role-types';
import { PaginatedUsers, users_T } from '@/types/user-types';

const UserActionTab = ({
    users,
    roles,
    setFilteredUsers,
}: {
    users: PaginatedUsers;
    roles: roles_T[];
    setFilteredUsers: (users: users_T[]) => void;
}) => {
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [barangayFilter, setBarangayFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Extract unique roles from users data
    const searchableRoles = useMemo(() => {
        return users.data
            .map((user: users_T) => user.role?.name)
            .filter((roleName): roleName is string => Boolean(roleName))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            )
            .sort();
    }, [users.data]);

    // Extract unique barangays from users data
    const searchableBarangays = useMemo(() => {
        return users.data
            .map(
                (user: users_T) =>
                    user.citizen_details?.barangay ||
                    user.official_details?.assigned_brgy,
            )
            .filter((barangay): barangay is string => Boolean(barangay))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            )
            .sort();
    }, [users.data]);

    // Filter displayed users based on selected filters
    useEffect(() => {
        let filteredResults = users.data;

        // Filter by role
        if (roleFilter !== 'all') {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.role?.name === roleFilter,
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.status === statusFilter,
            );
        }

        // Filter by barangay
        if (barangayFilter !== 'all') {
            filteredResults = filteredResults.filter(
                (user: users_T) =>
                    user.citizen_details?.barangay === barangayFilter ||
                    user.official_details?.assigned_brgy === barangayFilter,
            );
        }

        // Filter by search query (name or email)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((user: users_T) => {
                let fullName = user.name.toLowerCase();

                if (user.official_details) {
                    fullName =
                        `${user.official_details.first_name} ${user.official_details.middle_name || ''} ${user.official_details.last_name}`.toLowerCase();
                } else if (user.citizen_details) {
                    fullName =
                        `${user.citizen_details.first_name} ${user.citizen_details.middle_name || ''} ${user.citizen_details.last_name}`.toLowerCase();
                }

                const email = user.email.toLowerCase();
                const query = searchQuery.toLowerCase();

                return fullName.includes(query) || email.includes(query);
            });
        }

        setFilteredUsers(filteredResults);
    }, [roleFilter, statusFilter, barangayFilter, searchQuery, users.data, setFilteredUsers]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
        setBarangayFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        roleFilter !== 'all' ||
        statusFilter !== 'all' ||
        barangayFilter !== 'all';

    // Count filtered results
    const filteredCount = useMemo(() => {
        let count = users.data.length;
        
        let filtered = users.data;
        if (roleFilter !== 'all') {
            filtered = filtered.filter((user) => user.role?.name === roleFilter);
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter((user) => user.status === statusFilter);
        }
        if (barangayFilter !== 'all') {
            filtered = filtered.filter(
                (user) =>
                    user.citizen_details?.barangay === barangayFilter ||
                    user.official_details?.assigned_brgy === barangayFilter,
            );
        }
        if (searchQuery.trim()) {
            filtered = filtered.filter((user) => {
                let fullName = user.name.toLowerCase();
                if (user.official_details) {
                    fullName = `${user.official_details.first_name} ${user.official_details.middle_name || ''} ${user.official_details.last_name}`.toLowerCase();
                } else if (user.citizen_details) {
                    fullName = `${user.citizen_details.first_name} ${user.citizen_details.middle_name || ''} ${user.citizen_details.last_name}`.toLowerCase();
                }
                const email = user.email.toLowerCase();
                return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
            });
        }
        return filtered.length;
    }, [users.data, roleFilter, statusFilter, barangayFilter, searchQuery]);

    return (
        <div className="flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-3 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="text-xs font-medium hidden sm:inline">Filters:</span>
                    </div>

                    {/* Role Filter */}
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {searchableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Barangay Filter */}
                    <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue placeholder="Barangay" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Barangays</SelectItem>
                            {searchableBarangays.map((barangay) => (
                                <SelectItem key={barangay} value={barangay}>
                                    {barangay}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    Showing {filteredCount} of {users.data.length} users
                </span>
                {hasActiveFilters && (
                    <span className="text-primary">Filters applied</span>
                )}
            </div>
        </div>
    );
};

export default UserActionTab;
