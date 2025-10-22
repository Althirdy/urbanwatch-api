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
import { useForm } from '@inertiajs/react';
import { Calendar, TriangleAlert, User } from 'lucide-react';

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
            preserveScroll: true,
        });
    };

    const statusLabel = getStatusLabel(post.published_at);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Archive Public Post</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Are you sure you want to archive{' '}
                                <strong>Public Post #{post.id}</strong>?
                            </p>

                            {/* Post Details */}
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <TriangleAlert className="h-4 w-4" />
                                        <span>
                                            <strong>Report:</strong>{' '}
                                            {post.report?.report_type ||
                                                'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>
                                            <strong>Reporter:</strong>{' '}
                                            {post.report?.user?.name ||
                                                'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            <strong>Status:</strong>{' '}
                                            {statusLabel}
                                        </span>
                                    </div>
                                    {post.published_at && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                <strong>Published:</strong>{' '}
                                                {new Date(
                                                    post.published_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {post.report?.transcript && (
                                    <div className="mt-2 border-t pt-2">
                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                            {post.report.transcript}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="text-sm font-medium text-destructive">
                                ⚠️ This action cannot be undone. The post will
                                be permanently removed from public view.
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
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
