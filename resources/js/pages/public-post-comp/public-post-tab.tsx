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

import { PublicPost_T } from '@/types/public-post-types';

interface PublicPostTabProps {
    posts: PublicPost_T[];
    setFilteredPosts: (posts: PublicPost_T[]) => void;
}

const PublicPostTab = ({ posts, setFilteredPosts }: PublicPostTabProps) => {
    const [reportTypeOpen, setReportTypeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [reportTypeValue, setReportTypeValue] = useState<string | null>(null);
    const [statusValue, setStatusValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchableReportTypes, setSearchableReportTypes] = useState<
        string[]
    >([]);

    // Extract unique report types from posts data
    useEffect(() => {
        const reportTypes = posts
            .map((post: PublicPost_T) => post.report?.report_type)
            .filter((reportType): reportType is string => Boolean(reportType))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableReportTypes(reportTypes);
    }, [posts]);

    // Filter displayed posts based on selected report type, status, and search query
    useEffect(() => {
        let filteredResults = posts;

        // Filter by report type if selected
        if (reportTypeValue) {
            filteredResults = filteredResults.filter(
                (post: PublicPost_T) =>
                    post.report?.report_type === reportTypeValue,
            );
        }

        // Filter by status if selected
        if (statusValue) {
            const now = new Date();
            filteredResults = filteredResults.filter((post: PublicPost_T) => {
                switch (statusValue) {
                    case 'published':
                        return (
                            post.published_at &&
                            new Date(post.published_at) <= now
                        );
                    case 'draft':
                        return !post.published_at;
                    case 'scheduled':
                        return (
                            post.published_at &&
                            new Date(post.published_at) > now
                        );
                    default:
                        return true;
                }
            });
        }

        // Filter by search query (report content or description)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((post: PublicPost_T) => {
                const transcript = post.report?.transcript?.toLowerCase() || '';
                const description =
                    post.report?.description?.toLowerCase() || '';
                const reporterName =
                    post.report?.user?.name?.toLowerCase() || '';
                const publisherName =
                    post.publishedBy?.name?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();

                return (
                    transcript.includes(query) ||
                    description.includes(query) ||
                    reporterName.includes(query) ||
                    publisherName.includes(query)
                );
            });
        }

        setFilteredPosts(filteredResults);
    }, [reportTypeValue, statusValue, searchQuery, posts, setFilteredPosts]);

    const statusOptions = [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
    ];

    return (
        <div className="flex max-w-4xl flex-wrap gap-4">
            <Input
                placeholder="Search by content, reporter, or publisher"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 min-w-[300px] flex-1"
            />

            <Popover open={reportTypeOpen} onOpenChange={setReportTypeOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={reportTypeOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {reportTypeValue || 'Select report type...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search report type..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No report type found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Report Types" option */}
                                <CommandItem
                                    key="all-report-types"
                                    value=""
                                    onSelect={() => {
                                        setReportTypeValue(null);
                                        setReportTypeOpen(false);
                                    }}
                                >
                                    All Report Types
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            reportTypeValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use searchableReportTypes for dropdown options */}
                                {searchableReportTypes.map((reportType) => (
                                    <CommandItem
                                        key={reportType}
                                        value={reportType}
                                        onSelect={(currentValue) => {
                                            setReportTypeValue(
                                                currentValue === reportTypeValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setReportTypeOpen(false);
                                        }}
                                    >
                                        {reportType}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                reportTypeValue === reportType
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
                        className="w-[150px] cursor-pointer justify-between"
                    >
                        {statusValue
                            ? statusOptions.find((s) => s.value === statusValue)
                                  ?.label
                            : 'Select status...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[150px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search status..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Statuses" option */}
                                <CommandItem
                                    key="all-statuses"
                                    value=""
                                    onSelect={() => {
                                        setStatusValue(null);
                                        setStatusOpen(false);
                                    }}
                                >
                                    All Statuses
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            statusValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Status options */}
                                {statusOptions.map((status) => (
                                    <CommandItem
                                        key={status.value}
                                        value={status.value}
                                        onSelect={(currentValue) => {
                                            setStatusValue(
                                                currentValue === statusValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setStatusOpen(false);
                                        }}
                                    >
                                        {status.label}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                statusValue === status.value
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

export default PublicPostTab;
