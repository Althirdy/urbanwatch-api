import { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowUpDown,
    ExternalLink as Open,
    SquarePen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { formatDateTime } from '@/lib/utils';
import { PublicPost_T } from '@/types/public-post-types';
import ArchivePublicPost from './public-post-archive';
import EditPublicPost from './public-post-edit';
import ViewPublicPostDetails from './public-post-view';

const reportTypeColors: Record<string, string> = {
    CCTV: 'bg-blue-800 ',
    'Citizen Concern': 'bg-purple-800 ',
    Emergency: 'bg-red-800 ',
    Announcement: 'bg-yellow-800',
};

function getStatusBadge(publishedAt: string | null) {
    if (!publishedAt) {
        return (
            <span className="inline-flex items-center rounded-md border bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
                DRAFT
            </span>
        );
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return (
            <span className="inline-flex items-center rounded-md border bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                SCHEDULED
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-md border bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
            PUBLISHED
        </span>
    );
}

export const columns = (): ColumnDef<PublicPost_T>[] => [
    {
        accessorKey: 'id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Post ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>#{row.getValue('id')}</div>,
    },
    {
        accessorKey: 'category',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const post = row.original;
            const category = post.category || 'General';
            const colorClass =
                reportTypeColors[category] || 'bg-gray-100 text-gray-800';

            return (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${colorClass}`}
                >
                    {category}
                </span>
            );
        },
    },
    {
        id: 'content',
        header: 'Post Content',
        cell: ({ row }) => {
            const post = row.original;
            return (
                <div className="max-w-xs text-left">
                    <div className="ellipsis flex flex-col truncate">
                        <span className="text-md font-semibold">
                            {post.title}
                        </span>
                        <span
                            className="mt-1 block truncate text-xs text-muted-foreground"
                            title={post.content}
                        >
                            {post.content &&
                                post.content.length > 100
                                ? post.content.substring(0, 100) +
                                '...'
                                : post.content}
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'publishedBy.name',
        header: 'Published By',
        cell: ({ row }) => {
            const post = row.original;
            return (
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">
                        {post.publishedBy?.name || 'Barangay Office'}
                    </span>
                </div>
            );
        },
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const post = row.original;
            return getStatusBadge(post.published_at);
        },
    },
    {
        accessorKey: 'published_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Published Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const publishedAt = row.getValue('published_at') as string | null;
            return publishedAt ? (
                <span>{formatDateTime(publishedAt)}</span>
            ) : (
                <span>Not published</span>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
            const post = row.original;

            return (
                <div className="flex justify-center gap-2">
                    <Tooltip>
                        <ViewPublicPostDetails post={post}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <Open className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </ViewPublicPostDetails>
                        <TooltipContent>
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <EditPublicPost post={post}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <SquarePen className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </EditPublicPost>
                        <TooltipContent>
                            <p>Edit Post</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <ArchivePublicPost post={post}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <Archive className="h-4 w-4 text-[var(--destructive)]" />
                                </Button>
                            </TooltipTrigger>
                        </ArchivePublicPost>
                        <TooltipContent>
                            <p>Archive Post</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
