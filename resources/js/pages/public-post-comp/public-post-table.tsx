import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { formatDateTime } from '@/lib/utils';
import { PublicPost_T } from '@/types/public-post-types';
import ArchivePublicPost from './public-post-archive';
import EditPublicPost from './public-post-edit';
import ViewPublicPostDetails from './public-post-view';

function PublicPostsTable({
    posts,
    links,
    currentPage = 1,
    lastPage = 1,
}: {
    posts: PublicPost_T[];
    links?: any[];
    currentPage?: number;
    lastPage?: number;
}) {
    function getStatusBadge(publishedAt: string | null) {
        if (!publishedAt) {
            return <span className="uppercase">Draft</span>;
        }

        const publishDate = new Date(publishedAt);
        const now = new Date();

        if (publishDate > now) {
            return <span className="uppercase">Scheduled</span>;
        }

        return <span className="uppercase">Published</span>;
    }

    return (
        <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--sidebar)]">
            <Table className="m-0 border">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Post ID
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Report Type
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Report Content
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Reporter
                        </TableHead>

                        <TableHead className="border-r py-4 text-center font-semibold">
                            Status
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Published Date
                        </TableHead>
                        <TableHead className="py-4 text-center font-semibold">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {posts.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No posts found at the moment
                            </TableCell>
                        </TableRow>
                    ) : (
                        posts.map((post) => (
                            <TableRow
                                key={post.id}
                                className="text-center text-muted-foreground"
                            >
                                <TableCell className="py-3 font-medium">
                                    #{post.id}
                                </TableCell>
                                <TableCell className="py-3">
                                    {post.report?.report_type || 'Unknown'}
                                </TableCell>
                                <TableCell className="max-w-xs py-3 text-left">
                                    <div className="ellipsis flex flex-col truncate">
                                        <span className="font-semibold">
                                            {post.report?.transcript}
                                        </span>

                                        <span
                                            className="mt-1 block truncate text-muted-foreground"
                                            title={post.report.description}
                                        >
                                            {post.report.description.length >
                                            100
                                                ? post.report.description.substring(
                                                      0,
                                                      100,
                                                  ) + '...'
                                                : post.report.description}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    {post.report?.user?.name || 'Unknown'}
                                </TableCell>

                                <TableCell className="py-3">
                                    {getStatusBadge(post.published_at)}
                                </TableCell>
                                <TableCell className="py-3">
                                    {post.published_at ? (
                                        <span>
                                            {formatDateTime(post.published_at)}
                                        </span>
                                    ) : (
                                        <span>Not published</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
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
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {links && links.length > 0 && (
                <div className="flex items-center justify-between border-t p-4">
                    <span className="text-sm text-muted-foreground">
                        0 of {posts.length} row(s) selected
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {lastPage}
                        </span>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={links[0]?.url || '#'}
                                    />
                                </PaginationItem>
                                {links.map((link, index) => {
                                    if (
                                        link.label !== '&laquo; Previous' &&
                                        link.label !== 'Next &raquo;' &&
                                        link.url
                                    ) {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationLink
                                                    isActive={link.active}
                                                    href={link.url}
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                })}
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href={
                                            links[links.length - 1]?.url || '#'
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PublicPostsTable;
