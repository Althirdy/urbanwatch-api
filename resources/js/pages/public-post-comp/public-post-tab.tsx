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

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown,Search, Filter, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PublicPost_T } from '@/types/public-post-types';
import CreatePublicPostModal from './create-public-post-modal';

interface PublicPostTabProps {
    posts: PublicPost_T[];
    setFilteredPosts: (posts: PublicPost_T[]) => void;
}

const PublicPostTab = ({ posts, setFilteredPosts }: PublicPostTabProps) => {
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [categoryValue, setCategoryValue] = useState<string | null>(null);
    const [statusValue, setStatusValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchableCategories, setSearchableCategories] = useState<string[]>(
        [],
    );

    // Extract unique categories from posts data
    useEffect(() => {
        const categories = posts
            .map((post: PublicPost_T) => post.category)
            .filter((category): category is string => Boolean(category))
            .filter(
                (value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index,
            );
        setSearchableCategories(categories);
    }, [posts]);

    // Filter displayed posts based on selected category, status, and search query
    const filteredResults = React.useMemo(() => {
        let filtered = posts;

        // Filter by category if selected
        if (categoryValue) {
            filtered = filtered.filter(
                (post: PublicPost_T) => post.category === categoryValue,
            );
        }

        // Filter by status if selected
        if (statusValue) {
            const now = new Date();
            filtered = filtered.filter((post: PublicPost_T) => {
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

        // Filter by search query (title or content)
        if (searchQuery.trim()) {
            filtered = filtered.filter((post: PublicPost_T) => {
                const title = post.title?.toLowerCase() || '';
                const content = post.content?.toLowerCase() || '';
                const publisherName =
                    post.publishedBy?.name?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();

                return (
                    title.includes(query) ||
                    content.includes(query) ||
                    publisherName.includes(query)
                );
            });
        }

        return filtered;
    }, [categoryValue, statusValue, searchQuery, posts]);

    useEffect(() => {
        setFilteredPosts(filteredResults);
    }, [filteredResults, setFilteredPosts]);

    const statusOptions = [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
    ];

    return (
        <>
            <div className=" flex flex-col gap-4">
            
            <div className="flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-3 dark:border-zinc-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, content, or publisher"
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

                        {/* Category Filter */}
                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoryOpen}
                                    className="h-8 w-[150px] justify-between text-xs cursor-pointer"
                                >
                                    {categoryValue || 'Category'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[180px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Search category..."
                                        className="h-9"
                                    />
                                    <CommandList>
                                        <CommandEmpty>No category found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                key="all-categories"
                                                value=""
                                                onSelect={() => {
                                                    setCategoryValue(null);
                                                    setCategoryOpen(false);
                                                }}
                                            >
                                                All Categories
                                                <Check
                                                    className={cn(
                                                        'ml-auto h-4 w-4',
                                                        categoryValue === null
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
                                            {searchableCategories.map((category) => (
                                                <CommandItem
                                                    key={category}
                                                    value={category}
                                                    onSelect={(currentValue) => {
                                                        setCategoryValue(
                                                            currentValue === categoryValue
                                                                ? null
                                                                : currentValue,
                                                        );
                                                        setCategoryOpen(false);
                                                    }}
                                                >
                                                    {category}
                                                    <Check
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            categoryValue === category
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

                        {/* Status Filter */}
                        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={statusOpen}
                                    className="h-8 w-[130px] justify-between text-xs cursor-pointer"
                                >
                                    {statusValue
                                        ? statusOptions.find((s) => s.value === statusValue)?.label
                                        : 'Status'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                        'ml-auto h-4 w-4',
                                                        statusValue === null
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                            </CommandItem>
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
                                                            'ml-auto h-4 w-4',
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

                        {/* Clear Filters */}
                        {(searchQuery.trim() || categoryValue !== null || statusValue !== null) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCategoryValue(null);
                                    setStatusValue(null);
                                }}
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
                        Showing {filteredResults.length} of {posts.length} posts
                    </span>
                    {(searchQuery.trim() || categoryValue !== null || statusValue !== null) && (
                        <span className="text-primary">Filters applied</span>
                    )}
                </div>
            </div>
            </div>
        </>
    );
};

export default PublicPostTab;
