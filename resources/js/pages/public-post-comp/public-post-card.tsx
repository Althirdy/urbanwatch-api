import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Archive, ExternalLink as Open, SquarePen, CheckCircle2, Dot } from 'lucide-react';
import { useState, useEffect } from 'react';

import { baseBadgeClasses, getPublicationStatusColorClass, getStatusColorClass, publicationStatusColors } from '@/lib/badgeStyles';
import { PublicPost_T } from '@/types/public-post-types';
import ArchivePublicPost from './public-post-archive';
import EditPublicPost from './public-post-edit';
import ViewPublicPostDetails from './public-post-view';
import ResolvePublicPost from './public-post-resolve';
import { cn } from '@/lib/utils';

// Real-time status badge component for cards
function StatusBadge({ publishedAt }: { publishedAt: string | null }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (publishedAt) {
            const publishDate = new Date(publishedAt);
            const currentTime = new Date();

            // Only set up timer if the post is scheduled (future date)
            if (publishDate > currentTime) {
                // Calculate exact milliseconds until publication
                const msUntilPublish = publishDate.getTime() - currentTime.getTime();

                // Set a timeout to update exactly when the post should be published
                // Add a small buffer (100ms) to ensure we're past the publish time
                const timeout = setTimeout(() => {
                    setNow(new Date());
                }, msUntilPublish + 100);

                return () => clearTimeout(timeout);
            }
        }
    }, [publishedAt, now]);

    if (!publishedAt) {
        return (
            <Badge
                variant="outline"
                className={`${baseBadgeClasses} ${publicationStatusColors.draft}`}
            >
                Draft
            </Badge>
        );
    }

    const publishDate = new Date(publishedAt);

    if (publishDate > now) {
        return (
            <Badge
                variant="outline"
                className={`${baseBadgeClasses} ${publicationStatusColors.scheduled}`}
            >
                Scheduled
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={`${baseBadgeClasses} ${publicationStatusColors.published}`}
        >
            Published
        </Badge>
    );
}

function getStatusInfo(publishedAt: string | null) {
    if (!publishedAt) {
        return {
            label: 'Draft',
            className: publicationStatusColors.draft
        };
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return {
            label: 'Scheduled',
            className: publicationStatusColors.scheduled,
        };
    }

    return {
        label: 'Published',
        className: publicationStatusColors.published
    };
}

const POSTS_PER_PAGE = 8;

const PublicPostCard = ({ posts }: { posts: PublicPost_T[] }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedPosts.length === 0 && (
                    <Card className="col-span-full border bg-card dark:border-zinc-800">
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                No posts found matching your selection.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {paginatedPosts.map((post) => {
                    return (
                        <Card
                            key={post.id}
                            className="group relative flex h-full flex-col overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                        >
                            <CardHeader className=" pt-1 px-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="line-clamp-1 text-lg font-bold">
                                            {post.title || `Post #${post.id}`}
                                        </CardTitle>
                                        <CardDescription className="mt-1 flex flex-wrap gap-1">
                                            <StatusBadge publishedAt={post.published_at} />
                                            {post.category && (
                                                <Badge
                                                    variant="outline"
                                                    className={`${baseBadgeClasses} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 capitalize`}
                                                >
                                                    {post.category}
                                                </Badge>
                                            )}
                                            {post.postable?.status && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        baseBadgeClasses,
                                                        "capitalize",
                                                        getStatusColorClass(post.postable.status)
                                                    )}
                                                >
                                                    {post.postable.status}
                                                </Badge>
                                            )}
                                            {post.published_at && (
                                                <div className="flex flex-row gap-1 text-muted-foreground items-center">
                                                    <Dot className="inline h-4 w-auto" />
                                                    <span className="text-xs"> {new Date(post.published_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}</span>


                                                    <span className="text-xs">

                                                        {new Date(post.published_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>

                                                </div>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="flex flex-col gap-2">
                                    <p className="line-clamp-4 text-sm text-muted-foreground leading-relaxed">
                                        {post.content || 'No content available'}
                                    </p>
                                    {post.image_path && (

                                        <img
                                            src={post.image_path}
                                            alt={post.title}
                                            className="h-36 w-full rounded-[var(--radius)] object-cover"
                                        />
                                    )}


                                </div>
                            </CardContent>
                            <CardFooter className="mt-auto">
                                <div className="flex items-center w-full justify-end gap-1.5 pt-1.5 dark:border-zinc-800">
                                    <Tooltip>
                                        <ViewPublicPostDetails post={post}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <Open className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                            </TooltipTrigger>
                                        </ViewPublicPostDetails>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                            <p>View Details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <EditPublicPost post={post}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                            </TooltipTrigger>
                                        </EditPublicPost>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                            <p>Edit Post</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {post.postable?.status === 'ongoing' && (
                                        <Tooltip>
                                            <ResolvePublicPost post={post}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer h-8 w-8 p-0 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </Button>
                                                </TooltipTrigger>
                                            </ResolvePublicPost>
                                            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                                <p>Resolve Accident</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    <Tooltip>
                                        <ArchivePublicPost post={post}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                                >
                                                    <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                                </Button>
                                            </TooltipTrigger>
                                        </ArchivePublicPost>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                            <p>Archive Post</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(startIndex + POSTS_PER_PAGE, posts.length)} of {posts.length} posts
                    </p>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => handlePageChange(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
};

export default PublicPostCard;
