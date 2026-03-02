import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Contact, PaginatedContacts } from '@/types/contacts-types';
import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ContactActionTab = ({
    contacts,
    setFilteredContacts,
}: {
    contacts: PaginatedContacts;
    setFilteredContacts: (contacts: Contact[]) => void;
}) => {
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [responderFilter, setResponderFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Extract unique branch/unit names
    const searchableUnits = useMemo(() => {
        return contacts.data
            .map((contact: Contact) => contact.branch_unit_name)
            .filter((unit): unit is string => Boolean(unit))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            )
            .sort();
    }, [contacts.data]);

    // Extract unique responder types
    const responderTypes = useMemo(() => {
        return contacts.data
            .map((contact: Contact) => contact.responder_type)
            .filter((type): type is string => Boolean(type))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            )
            .sort();
    }, [contacts.data]);

    // Filter displayed contacts
    useEffect(() => {
        let filteredResults = contacts.data;

        // Filter by branch/unit name
        if (branchFilter !== 'all') {
            filteredResults = filteredResults.filter(
                (contact: Contact) => contact.branch_unit_name === branchFilter,
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filteredResults = filteredResults.filter(
                (contact: Contact) => contact.active === isActive,
            );
        }

        // Filter by responder type
        if (responderFilter !== 'all') {
            filteredResults = filteredResults.filter(
                (contact: Contact) => contact.responder_type === responderFilter,
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((contact: Contact) => {
                const branch = contact.branch_unit_name.toLowerCase();
                const person = contact.contact_person?.toLowerCase() || '';
                const primary = contact.primary_mobile.toLowerCase();
                const backup = (contact.backup_mobile || '').toLowerCase();
                const query = searchQuery.toLowerCase();

                return (
                    branch.includes(query) ||
                    person.includes(query) ||
                    primary.includes(query) ||
                    backup.includes(query)
                );
            });
        }

        setFilteredContacts(filteredResults);
    }, [branchFilter, statusFilter, responderFilter, searchQuery, contacts.data, setFilteredContacts]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setBranchFilter('all');
        setStatusFilter('all');
        setResponderFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        branchFilter !== 'all' ||
        statusFilter !== 'all' ||
        responderFilter !== 'all';

    // Count filtered results
    const filteredCount = useMemo(() => {
        let filtered = contacts.data;
        
        if (branchFilter !== 'all') {
            filtered = filtered.filter((c) => c.branch_unit_name === branchFilter);
        }
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter((c) => c.active === isActive);
        }
        if (responderFilter !== 'all') {
            filtered = filtered.filter((c) => c.responder_type === responderFilter);
        }
        if (searchQuery.trim()) {
            filtered = filtered.filter((c) => {
                const query = searchQuery.toLowerCase();
                return (
                    c.branch_unit_name.toLowerCase().includes(query) ||
                    (c.contact_person?.toLowerCase() || '').includes(query) ||
                    c.primary_mobile.toLowerCase().includes(query) ||
                    (c.backup_mobile || '').toLowerCase().includes(query)
                );
            });
        }
        return filtered.length;
    }, [contacts.data, branchFilter, statusFilter, responderFilter, searchQuery]);

    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by response unit, contact person, or mobile..."
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

                    {/* Branch/Unit Filter */}
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {searchableUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                    {unit}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Responder Type Filter */}
                    <Select value={responderFilter} onValueChange={setResponderFilter}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {responderTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
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
                    Showing {filteredCount} of {contacts.data.length} contacts
                </span>
                {hasActiveFilters && (
                    <span className="text-primary">Filters applied</span>
                )}
            </div>
        </div>
    );
};

export default ContactActionTab;
