import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { roles } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { roles_T } from '@/types/role-types';
import CreateRoles from './roles-comp/create-roles';
import DeleteRoles from './roles-comp/delete-roles';
import EditRoles from './roles-comp/edit-roles';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: roles().url,
    },
];

export default function Roles({ roles }: { roles: any }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    // For displaying the cards (filtered by selected role)
    const [filtered_roles, setFilteredRoles] = useState<roles_T[]>(roles.data);
    // For searching within the combobox options
    const [searchable_roles, setSearchableRoles] = useState<roles_T[]>(
        roles.data,
    );
    // Filter displayed cards based on selected value
    useEffect(() => {
        if (value) {
            setFilteredRoles(
                roles.data.filter((role: roles_T) => role.name === value),
            );
        } else {
            setFilteredRoles(roles.data);
        }
    }, [value, roles.data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="space-y-4 p-4">
                <CreateRoles />
                <div className="flex max-w-xl gap-4">
                    <Input placeholder="Search role" className="h-12" />
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="h-12 w-[200px] justify-between"
                            >
                                {value || 'Select role...'}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput
                                    onValueChange={(searchValue) => {
                                        if (searchValue.trim()) {
                                            // Only filter the searchable options, not the displayed cards
                                            setSearchableRoles(
                                                roles.data.filter(
                                                    (role: roles_T) =>
                                                        role.name
                                                            .toLowerCase()
                                                            .includes(
                                                                searchValue.toLowerCase(),
                                                            ),
                                                ),
                                            );
                                        } else {
                                            // Reset to show all roles in the dropdown
                                            setSearchableRoles(roles.data);
                                        }
                                    }}
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
                                        {searchable_roles.map((role) => (
                                            <CommandItem
                                                key={role.id}
                                                value={role.name}
                                                onSelect={(currentValue) => {
                                                    setValue(
                                                        currentValue === value
                                                            ? null
                                                            : currentValue,
                                                    );
                                                    setOpen(false);
                                                }}
                                            >
                                                {role.name}
                                                <Check
                                                    className={cn(
                                                        'ml-auto',
                                                        value === role.name
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

                <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
                    {filtered_roles.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            No roles found matching your selection.
                        </div>
                    )}

                    {/* Use filtered_roles for displaying cards */}
                    {filtered_roles.map((role: roles_T) => (
                        <Card
                            key={role.id}
                            className="relative overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                        >
                            <CardHeader>
                                <h1 className="text-xl font-bold">
                                    {role.name}
                                </h1>
                                <div className="flex gap-2">
                                    {!!role.is_default && (
                                        <Badge>Default</Badge>
                                    )}
                                    <p className="text-sm text-primary/50">
                                        {role.users_count}{' '}
                                        {role.users_count > 1
                                            ? 'Users'
                                            : 'User'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardDescription className="px-6">
                                <p>{role.description}</p>
                            </CardDescription>
                            <CardFooter className="w-full justify-end">
                                <EditRoles role={role} />
                                {!role.is_default && (
                                    <DeleteRoles role={role} />
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
