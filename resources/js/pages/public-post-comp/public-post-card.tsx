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
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { PublicPost_T } from '@/types/public-post-types';
import ArchivePublicPost from './public-post-archive';
import EditPublicPost from './public-post-edit';
import ViewPublicPostDetails from './public-post-view';

function getStatusInfo(publishedAt: string | null) {
    if (!publishedAt) {
        return { label: 'Draft', className: 'bg-gray-100 text-gray-800' };
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800' };
    }

    return { label: 'Published', className: 'bg-green-100 text-green-800' };
}

const PublicPostCard = ({ posts }: { posts: PublicPost_T[] }) => {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {posts.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                    No posts found matching your selection.
                </div>
            )}

            {posts.map((post) => {
                const statusInfo = getStatusInfo(post.published_at);

                return (
                    <Card
                        key={post.id}
                        className="relative overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                    >
                        <CardHeader>
                            <CardTitle> Post ID: #{post.id}</CardTitle>
                            <CardDescription>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                                    {statusInfo.label}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">
                                    Report Content
                                </p>
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                                        post.report?.report_type === 'CCTV' ? 'bg-blue-100 text-blue-800' :
                                        post.report?.report_type === 'Citizen Concern' ? 'bg-purple-100 text-purple-800' :
                                        post.report?.report_type === 'Emergency' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {post.report?.report_type}
                                    </span>
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        {post.report?.transcript ||
                                            'No transcript available'}
                                    </p>
                                    {post.report?.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {post.report.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full justify-end gap-2">
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
                                        <p>Edit User</p>
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
                                        <p>Archive User</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
};

export default PublicPostCard;
