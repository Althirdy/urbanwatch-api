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
import { Archive, ExternalLink as Open, SquarePen, CheckCircle2, Calendar } from 'lucide-react';
import { useState } from 'react';

import { PublicPost_T } from '@/types/public-post-types';
import ArchivePublicPost from './public-post-archive';
import EditPublicPost from './public-post-edit';
import ViewPublicPostDetails from './public-post-view';
import ResolvePublicPost from './public-post-resolve';
import { cn } from '@/lib/utils';

const reportTypeColors: Record<string, string> = {
    CCTV: 'bg-blue-800',
    'Citizen Concern': 'bg-purple-800',
    Emergency: 'bg-red-800',
    Announcement: 'bg-yellow-800',
};

function getStatusInfo(publishedAt: string | null) {
    if (!publishedAt) {
        return {
            label: 'Draft',
            className: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
        };
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return {
            label: 'Scheduled',
            className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        };
    }

    return {
        label: 'Published',
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
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
            <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                {paginatedPosts.length === 0 && (
                    <Card className="col-span-full rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                No posts found matching your selection.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {paginatedPosts.map((post) => {
                    const statusInfo = getStatusInfo(post.published_at);

                    return (
                        <Card
                            key={post.id}
                            className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                        >
                            <CardHeader className="pb-2 pt-2 px-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="line-clamp-1 text-lg font-bold">
                                            {post.title || `Post #${post.id}`}
                                        </CardTitle>
                                        <CardDescription className="mt-1 flex flex-wrap gap-1">
                                            <Badge
                                                variant="outline"
                                                className={cn("font-medium", statusInfo.className)}
                                            >
                                                {statusInfo.label}
                                            </Badge>
                                            {post.category && (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-medium capitalize"
                                                >
                                                    {post.category}
                                                </Badge>
                                            )}
                                            {post.postable?.status && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "font-medium capitalize",
                                                        post.postable.status === 'resolved'
                                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                            : post.postable.status === 'ongoing'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                                : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
                                                    )}
                                                >
                                                    {post.postable.status}
                                                </Badge>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            {post.image_path && (
                                <div className="px-6">
                                    <img
                                        src={post.image_path}
                                        alt={post.title}
                                        className="h-36 w-full rounded-lg object-cover"
                                    />
                                </div>
                            )}
                            <CardContent className="flex-1">
                                <div className="flex flex-col gap-2">
                                    <p className="line-clamp-4 text-base text-muted-foreground leading-relaxed">
                                        {post.content || 'No content available'}
                                    </p>
                                    {post.published_at && (
                                        <p className="mt-auto text-xs text-muted-foreground">
                                            <Calendar className="inline mb-0.5 mr-1 h-3 w-3" />
                                            {new Date(post.published_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="mt-auto  ">

                                <div className="flex w-full justify-end gap-2 pt-2 border-t dark:border-zinc-800">
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

                                    {post.postable?.status === 'ongoing' && (
                                        <Tooltip>
                                            <ResolvePublicPost post={post}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer border-green-600 text-green-600 hover:bg-green-50"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                            </ResolvePublicPost>
                                            <TooltipContent>
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
