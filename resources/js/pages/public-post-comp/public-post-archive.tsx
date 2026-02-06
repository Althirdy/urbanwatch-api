import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PublicPost_T } from '@/types/public-post-types';
import { router, useForm } from '@inertiajs/react';
import { Archive, TriangleAlert, Dot } from 'lucide-react';

import { toast } from '@/components/use-toast';
import { baseBadgeClasses, getStatusColorClass, publicationStatusColors } from '@/lib/badgeStyles';
import { cn } from '@/lib/utils';

type ArchivePublicPostProps = {
    post: PublicPost_T;
    children: React.ReactNode;
};

function getStatusLabel(publishedAt: string | null) {
    if (!publishedAt) return 'Draft';

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) return 'Scheduled';
    return 'Published';
}

function ArchivePublicPost({ post, children }: ArchivePublicPostProps) {
    const { delete: destroy, processing } = useForm();

    const handleArchive = () => {
        destroy(`/public-post/${post.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                toast({
                    title: "Success",
                    description: "Public post archived successfully.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to archive public post.",
                    variant: "destructive",
                });
            },
            preserveScroll: true,
        });
    };

    const statusLabel = getStatusLabel(post.published_at);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent className="">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive Public Post
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this public post?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Post Details Card */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold truncate text-foreground">
                                    {post.title || `Post #${post.id}`}
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            baseBadgeClasses,
                                            statusLabel === 'Draft' && publicationStatusColors.draft,
                                            statusLabel === 'Scheduled' && publicationStatusColors.scheduled,
                                            statusLabel === 'Published' && publicationStatusColors.published
                                        )}
                                    >
                                        {statusLabel}
                                    </Badge>
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
                                            <span className="text-xs">
                                                {new Date(post.published_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <span className="text-xs">
                                                {new Date(post.published_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {post.image_path && (
                                    <div className="mt-3">
                                        <img
                                            src={post.image_path}
                                            alt={post.title}
                                            className="h-32 w-full rounded-md object-cover"
                                        />
                                    </div>
                                )}
                                {post.content && (
                                    <div className="mt-3">
                                        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                                            {post.content}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 border border-destructive/20">
                        <TriangleAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-destructive">
                            <p className="font-semibold">Warning</p>
                            <p className="mt-0.5">This action cannot be undone. The post will be permanently removed from public view.</p>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 pt-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleArchive}
                        disabled={processing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive Post'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ArchivePublicPost;
