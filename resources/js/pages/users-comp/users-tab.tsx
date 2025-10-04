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
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [open, setOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [barangayOpen, setBarangayOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const [statusValue, setStatusValue] = useState<string | null>(null);
    const [barangayValue, setBarangayValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchable_roles, setSearchableRoles] = useState<string[]>([]);
    const [searchable_barangays, setSearchableBarangays] = useState<string[]>(
        [],
    );

    // Extract unique roles and barangays from users data
    useEffect(() => {
        const roles = users.data
            .map((user: users_T) => user.role?.name)
            .filter((roleName): roleName is string => Boolean(roleName))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableRoles(roles);

        const barangays = users.data
            .map(
                (user: users_T) =>
                    user.citizen_details?.barangay ||
                    user.official_details?.assigned_brgy,
            )
            .filter((barangay): barangay is string => Boolean(barangay))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableBarangays(barangays);
    }, [users.data]);

    // Filter displayed users based on selected role, status, barangay and search query
    useEffect(() => {
        let filteredResults = users.data;

        // Filter by role if selected
        if (value) {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.role?.name === value,
            );
        }

        // Filter by status if selected
        if (statusValue) {
            filteredResults = filteredResults.filter(
                (user: users_T) => user.status === statusValue,
            );
        }

        // Filter by barangay if selected
        if (barangayValue) {
            filteredResults = filteredResults.filter(
                (user: users_T) =>
                    user.citizen_details?.barangay === barangayValue ||
                    user.official_details?.assigned_brgy === barangayValue,
            );
        }

        // Filter by search query (name or email)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((user: users_T) => {
                let fullName = user.name.toLowerCase();

                // Try to build full name from detail tables
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
    }, [
        value,
        statusValue,
        barangayValue,
        searchQuery,
        users.data,
        setFilteredUsers,
    ]);

    return (
        <div className="flex max-w-4xl flex-wrap gap-4">
            <Input
                placeholder="Search users by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 min-w-[300px] flex-1"
            />
            <Popover open={barangayOpen} onOpenChange={setBarangayOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={barangayOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {barangayValue || 'Select barangay...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search barangay..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No Barangay found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Barangays" option */}
                                <CommandItem
                                    key="all-barangay"
                                    value=""
                                    onSelect={() => {
                                        setBarangayValue(null);
                                        setBarangayOpen(false);
                                    }}
                                >
                                    All Barangays
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            barangayValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use searchable_barangays for dropdown options */}
                                {searchable_barangays.map((barangayName) => (
                                    <CommandItem
                                        key={barangayName}
                                        value={barangayName}
                                        onSelect={(currentValue) => {
                                            setBarangayValue(
                                                currentValue === barangayValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setBarangayOpen(false);
                                        }}
                                    >
                                        {barangayName}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                barangayValue === barangayName
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
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {value || 'Select role...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search role..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No Role found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Roles" option */}
                                <CommandItem
                                    key="all"
                                    value=""
                                    onSelect={() => {
                                        setValue(null);
                                        setOpen(false);
                                    }}
                                >
                                    All Roles
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            value === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use searchable_roles for dropdown options */}
                                {searchable_roles.map((roleName) => (
                                    <CommandItem
                                        key={roleName}
                                        value={roleName}
                                        onSelect={(currentValue) => {
                                            setValue(
                                                currentValue === value
                                                    ? null
                                                    : currentValue,
                                            );
                                            setOpen(false);
                                        }}
                                    >
                                        {roleName}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                value === roleName
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
        </div>
    );
};

export default UserActionTab;
