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
import { Check, ChevronsUpDown, Search, Filter, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { location_T } from '@/types/location-types';

const LocationActionTab = ({
    locations,
    setFilteredLocations,
}: {
    locations: location_T[];
    setFilteredLocations: (locations: location_T[]) => void;
}) => {
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [barangayOpen, setBarangayOpen] = useState(false);
    const [categoryValue, setCategoryValue] = useState<string | null>(null);
    const [barangayValue, setBarangayValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchable_barangays, setSearchableBarangays] = useState<string[]>(
        [],
    );

    // Extract unique barangays from locations data
    useEffect(() => {
        const barangays = locations
            .map((location: location_T) => location.barangay)
            .filter((barangay): barangay is string => Boolean(barangay))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableBarangays(barangays);
    }, [locations]);

    // Filter displayed locations based on selected category, barangay and search query
    useEffect(() => {
        let filteredResults = locations;

        // Filter by barangay if selected
        if (barangayValue) {
            filteredResults = filteredResults.filter(
                (location: location_T) => location.barangay === barangayValue,
            );
        }

        // Filter by search query (location name or landmark)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((location: location_T) => {
                const locationName = location.location_name.toLowerCase();
                const landmark = (location.landmark || '').toLowerCase();
                const query = searchQuery.toLowerCase();

                return locationName.includes(query) || landmark.includes(query);
            });
        }

        setFilteredLocations(filteredResults);
    }, [
        categoryValue,
        barangayValue,
        searchQuery,
        locations,
        setFilteredLocations,
    ]);

    // Determine if any filter is active
    const hasActiveFilters = searchQuery !== '' || barangayValue !== null;

    // Count filtered results
    const filteredCount = (() => {
        let filtered = locations;
        if (barangayValue) {
            filtered = filtered.filter((location) => location.barangay === barangayValue);
        }
        if (searchQuery.trim()) {
            filtered = filtered.filter((location) => {
                const locationName = location.location_name.toLowerCase();
                const landmark = (location.landmark || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                return locationName.includes(query) || landmark.includes(query);
            });
        }
        return filtered.length;
    })();

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setBarangayValue(null);
    };

    return (
        <div className="flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-3 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by location name or landmark..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Filter Controls */}
                {/* <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="text-xs font-medium hidden sm:inline">Filters:</span>
                    </div>

                    <Popover open={barangayOpen} onOpenChange={setBarangayOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={barangayOpen}
                                className="h-8 w-[130px] text-xs cursor-pointer justify-between"
                            >
                                {barangayValue || 'All Barangays'}
                                <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4" />
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
                </div> */}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    Showing {filteredCount} of {locations.length} locations
                </span>
                {hasActiveFilters && (
                    <span className="text-primary">Filters applied</span>
                )}
            </div>
        </div>
    );
};

export default LocationActionTab;
