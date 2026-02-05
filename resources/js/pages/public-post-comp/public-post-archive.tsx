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
import { Archive, Calendar, TriangleAlert, User } from 'lucide-react';

import { toast } from '@/components/use-toast';

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
            <AlertDialogContent className="sm:max-w-md">
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
                        <div className="flex items-center gap-3">
                            <div className="h-fit w-fit rounded-md bg-muted p-2 text-muted-foreground">
                                <TriangleAlert className="h-6 w-6" />
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <h3 className="text-lg font-bold truncate text-foreground">
                                    Post #{post.id}
                                </h3>
                                <div className="text-sm text-muted-foreground">
                                    {post.category || 'General'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-border pt-2 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Published By:</span>
                                <span className="font-medium text-foreground ml-auto">
                                    {post.publishedBy?.name || 'Barangay Office'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Status:</span>
                                <span className="font-medium text-foreground ml-auto">
                                    {statusLabel}
                                </span>
                            </div>
                            {post.published_at && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Published:</span>
                                    <span className="font-medium text-foreground ml-auto">
                                        {new Date(post.published_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {post.report?.transcript && (
                            <div className="mt-2 border-t border-border pt-2">
                                <p className="line-clamp-2 text-xs text-muted-foreground italic">
                                    "{post.report.transcript}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="text-sm font-medium text-destructive">
                        ⚠️ This action cannot be undone. The post will
                        be permanently removed from public view.
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
