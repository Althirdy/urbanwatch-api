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

import { Contact } from '@/types/contacts-types';

const ContactsActionTab = ({
    contacts,
    setFilteredContacts,
}: {
    contacts: Contact[];
    setFilteredContacts: (contacts: Contact[]) => void;
}) => {
    const [typeOpen, setTypeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [typeValue, setTypeValue] = useState<string | null>(null);
    const [statusValue, setStatusValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchableTypes, setSearchableTypes] = useState<string[]>([]);
    const [searchableStatuses, setSearchableStatuses] = useState<string[]>([]);

    // Extract unique types and statuses from contacts data
    useEffect(() => {
        const types = contacts
            .map((contact: Contact) => contact.responder_type)
            .filter((type): type is string => Boolean(type))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableTypes(types);

        const statuses = [
            ...new Set(
                contacts.map((contact: Contact) =>
                    contact.active ? 'Active' : 'Inactive',
                ),
            ),
        ] as string[];
        setSearchableStatuses(statuses);
    }, [contacts]);

    // Filter displayed contacts based on selected type, status and search query
    useEffect(() => {
        let filteredResults = contacts;

        // Filter by type if selected
        if (typeValue) {
            filteredResults = filteredResults.filter(
                (contact: Contact) => contact.responder_type === typeValue,
            );
        }

        // Filter by status if selected
        if (statusValue) {
            filteredResults = filteredResults.filter((contact: Contact) => {
                const contactStatus = contact.active ? 'Active' : 'Inactive';
                return contactStatus === statusValue;
            });
        }

        // Filter by search query (name, branch unit, location, or contact person)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((contact: Contact) => {
                const query = searchQuery.toLowerCase();
                return (
                    contact.branch_unit_name.toLowerCase().includes(query) ||
                    contact.location.toLowerCase().includes(query) ||
                    (contact.contact_person &&
                        contact.contact_person.toLowerCase().includes(query)) ||
                    contact.primary_mobile.includes(query)
                );
            });
        }

        setFilteredContacts(filteredResults);
    }, [typeValue, statusValue, searchQuery, contacts, setFilteredContacts]);

    return (
        <div className="flex max-w-4xl flex-wrap gap-4">
            <Input
                placeholder="Search contacts by name, branch, location, or number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 min-w-[300px] flex-1"
            />
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {typeValue || 'Select type...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search type..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No Type found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Types" option */}
                                <CommandItem
                                    key="all-type"
                                    value=""
                                    onSelect={() => {
                                        setTypeValue(null);
                                        setTypeOpen(false);
                                    }}
                                >
                                    All Types
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            typeValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use searchable_types for dropdown options */}
                                {searchableTypes.map((typeName) => (
                                    <CommandItem
                                        key={typeName}
                                        value={typeName}
                                        onSelect={(currentValue) => {
                                            setTypeValue(
                                                currentValue === typeValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setTypeOpen(false);
                                        }}
                                    >
                                        {typeName}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                typeValue === typeName
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
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {statusValue || 'Select status...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search status..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No Status found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Status" option */}
                                <CommandItem
                                    key="all-status"
                                    value=""
                                    onSelect={() => {
                                        setStatusValue(null);
                                        setStatusOpen(false);
                                    }}
                                >
                                    All Status
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            statusValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use searchable_statuses for dropdown options */}
                                {searchableStatuses.map((statusName) => (
                                    <CommandItem
                                        key={statusName}
                                        value={statusName}
                                        onSelect={(currentValue) => {
                                            setStatusValue(
                                                currentValue === statusValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setStatusOpen(false);
                                        }}
                                    >
                                        {statusName}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                statusValue === statusName
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

export default ContactsActionTab;
