import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { locations } from '@/lib/packages';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Filter, Search, X } from 'lucide-react';
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
    const [roleOpen, setRoleOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [locationOpen, setLocationOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>('active');
    const [locationFilter, setLocationFilter] = useState<string | null>(null);
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

    // Sort locations alphabetically by name
    const sortedLocations = useMemo(() => {
        return [...locations].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, []);

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
    ];

    // Filter displayed users based on selected filters
    useEffect(() => {
        let filteredResults = users.data;

        // Filter by role
        if (roleFilter) {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.role?.name === roleFilter,
            );
        }

        // Filter by status (compare lowercase since backend returns capitalized values)
        if (statusFilter) {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.status?.toLowerCase() === statusFilter.toLowerCase(),
            );
        }

        // Filter by location
        if (locationFilter) {
            const selectedLocation = locations.find(loc => loc.id.toString() === locationFilter);
            if (selectedLocation) {
                filteredResults = filteredResults.filter(
                    (user: users_T) =>
                        user.citizen_details?.barangay === selectedLocation.name ||
                        user.official_details?.assigned_brgy === selectedLocation.name,
                );
            }
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
    }, [roleFilter, statusFilter, locationFilter, searchQuery, users.data, locations, setFilteredUsers]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter(null);
        setStatusFilter(null);
        setLocationFilter(null);
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        roleFilter !== null ||
        statusFilter !== null ||
        locationFilter !== null;

    // Count filtered results
    const filteredCount = useMemo(() => {
        let filtered = users.data;
        if (roleFilter) {
            filtered = filtered.filter((user) => user.role?.name === roleFilter);
        }
        if (statusFilter) {
            filtered = filtered.filter((user) => user.status?.toLowerCase() === statusFilter.toLowerCase());
        }
        if (locationFilter) {
            const selectedLocation = locations.find(loc => loc.id.toString() === locationFilter);
            if (selectedLocation) {
                filtered = filtered.filter(
                    (user) =>
                        user.citizen_details?.barangay === selectedLocation.name ||
                        user.official_details?.assigned_brgy === selectedLocation.name,
                );
            }
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
    }, [users.data, roleFilter, statusFilter, locationFilter, searchQuery, locations]);

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
                    <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={roleOpen}
                                className="h-8 w-[120px] justify-between text-xs cursor-pointer"
                            >
                                {roleFilter || 'Role'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[150px] p-0">
                            <Command>
                                <CommandInput placeholder="Search role..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No role found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            key="all-roles"
                                            value=""
                                            onSelect={() => {
                                                setRoleFilter(null);
                                                setRoleOpen(false);
                                            }}
                                        >
                                            All Roles
                                            <Check
                                                className={cn(
                                                    'ml-auto h-4 w-4',
                                                    roleFilter === null ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                        </CommandItem>
                                        {searchableRoles.map((role) => (
                                            <CommandItem
                                                key={role}
                                                value={role}
                                                onSelect={(currentValue) => {
                                                    setRoleFilter(currentValue === roleFilter ? null : currentValue);
                                                    setRoleOpen(false);
                                                }}
                                            >
                                                {role}
                                                <Check
                                                    className={cn(
                                                        'ml-auto h-4 w-4',
                                                        roleFilter === role ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Status Filter */}
                    <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={statusOpen}
                                className="h-8 w-[120px] justify-between text-xs cursor-pointer"
                            >
                                {statusFilter ? statusOptions.find((s) => s.value === statusFilter)?.label : 'Status'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[150px] p-0">
                            <Command>
                                <CommandInput placeholder="Search status..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No status found.</CommandEmpty>
                                    <CommandGroup>
                                        {statusOptions.map((status) => (
                                            <CommandItem
                                                key={status.value}
                                                value={status.value}
                                                onSelect={(currentValue) => {
                                                    setStatusFilter(currentValue === statusFilter ? null : currentValue);
                                                    setStatusOpen(false);
                                                }}
                                            >
                                                {status.label}
                                                <Check
                                                    className={cn(
                                                        'ml-auto h-4 w-4',
                                                        statusFilter === status.value ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Location Filter */}
                    <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={locationOpen}
                                className="h-8 w-[150px] justify-between text-xs cursor-pointer"
                            >
                                {locationFilter
                                    ? sortedLocations.find((l) => l.id.toString() === locationFilter)?.name
                                    : 'Location'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[180px] p-0">
                            <Command>
                                <CommandInput placeholder="Search location..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No location found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            key="all-locations"
                                            value=""
                                            onSelect={() => {
                                                setLocationFilter(null);
                                                setLocationOpen(false);
                                            }}
                                        >
                                            All Locations
                                            <Check
                                                className={cn(
                                                    'ml-auto h-4 w-4',
                                                    locationFilter === null ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                        </CommandItem>
                                        {sortedLocations.map((location) => (
                                            <CommandItem
                                                key={location.id}
                                                value={location.name}
                                                onSelect={() => {
                                                    setLocationFilter(
                                                        location.id.toString() === locationFilter
                                                            ? null
                                                            : location.id.toString()
                                                    );
                                                    setLocationOpen(false);
                                                }}
                                            >
                                                {location.name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto h-4 w-4',
                                                        locationFilter === location.id.toString()
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3 " />

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
