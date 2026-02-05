import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCategoryBadgeClass } from '@/lib/badgeStyles';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { formatDateTime } from '@/lib/utils';
import { PublicPost_T } from '@/types/public-post-types';
import { router } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    Globe,
    ImageIcon,
    LocateFixed,
    Mail,
    MoveLeft,
    TriangleAlert,
    User,
} from 'lucide-react';
import { toast } from '@/components/use-toast';

type ViewPublicPostDetailsProps = {
    post: PublicPost_T;
    children: React.ReactNode;
};

type DetailItem = {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
};

function renderDetailItems(items: DetailItem[]) {
    return items.map(({ icon: Icon, text }, index) => (
        <div
            key={index}
            className="flex flex-row text-sm items-center gap-2 text-muted-foreground"
        >
            <Icon className="h-auto w-4" />
            <span>{text}</span>
        </div>
    ));
}

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
                Scheduled
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-md border bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
            Published
        </span>
    );
}

const reportTypeColors: Record<string, string> = {
    CCTV: 'bg-blue-800',
    'Citizen Concern': 'bg-purple-800',
    Emergency: 'bg-red-800',
    Announcement: 'bg-yellow-800',
};

function ViewPublicPostDetails({ post, children }: ViewPublicPostDetailsProps) {
    const handlePublish = () => {
        router.patch(
            `/public-post/${post.id}/publish`,
            {},
            {
                onSuccess: () => {
                    router.flushAll(); // Clear prefetch cache to prevent stale data
                    toast({
                        title: "Success",
                        description: "Public post published successfully.",
                    });
                },
                preserveScroll: true,
            },
        );
    };

    const handleUnpublish = () => {
        router.patch(
            `/public-post/${post.id}/unpublish`,
            {},
            {
                onSuccess: () => {
                    router.flushAll(); // Clear prefetch cache to prevent stale data
                    toast({
                        title: "Success",
                        description: "Public post unpublished successfully.",
                    });
                },
                preserveScroll: true,
            },
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <DialogHeader className="flex-shrink-0 px-6 pt-6  dark:border-zinc-800">
                    <DialogTitle className="text-xl font-bold">Public Post Details</DialogTitle>
                    <div className="flex items-center gap-2 ">
                        <span className="text-sm font-medium text-muted-foreground mr-2">Post ID: #{post.id}</span>
                        {getStatusBadge(post.published_at)}
                        <Badge className={`${getCategoryBadgeClass(post.category)} capitalize`}>
                            {post.category}
                        </Badge>
                    </div>
                </DialogHeader>
                <div className="flex w-full flex-1 flex-col justify-start gap-4 overflow-y-auto px-6 py-4">
                    {/* Post Content */}
                    <div className="flex flex-col gap-2">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-bold capitalize tracking-wide">
                                    Title: {post.title}
                                </p>

                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {post.content}
                            </p>
                        </div>
                    </div>
                    {/* Post Preview Image */}
                    <div className="flex flex-col gap-2">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-muted/20 flex flex-col items-center justify-center">
                            {post.image_path ? (
                                <img
                                    src={post.image_path}
                                    alt={post.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <>
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 opacity-20" />
                                        <span className="text-sm font-medium">No Image available</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>



                    {/* Publication Details */}
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold  text-muted-foreground">
                            Publication Details
                        </p>
                        <div className="grid gap-3 p-4 rounded-[var(--radius)] border bg-zinc-50 dark:bg-zinc-900/50">
                            {renderDetailItems([
                                {
                                    icon: User,
                                    text: `Published by: ${post.publishedBy?.name || 'Barangay Office'}`,
                                },
                                {
                                    icon: Calendar,
                                    text: post.published_at
                                        ? `Published: ${formatDateTime(post.published_at)}`
                                        : 'Not published yet',
                                },
                                {
                                    icon: Globe,
                                    text: `Created: ${formatDateTime(post.created_at)}`,
                                },
                            ])}
                        </div>
                    </div>

                    {/* Original Source Details (if linked) */}
                    {post.postable && (
                        <div className="flex flex-col gap-2">
                            <p className="text-md font-medium">
                                Original Source Information
                            </p>
                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                <p>Linked to: {post.postable_type?.split('\\').pop()}</p>
                                <p>Source ID: #{post.postable_id}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex-shrink-0 px-6 pb-4">
                    <div className="flex w-full gap-2">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 cursor-pointer py-4"
                            >
                                <MoveLeft className="inline h-4 w-4" />
                                Close
                            </Button>
                        </DialogClose>
                        {!post.published_at ? (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handlePublish}
                                className="flex-2 cursor-pointer py-4"
                            >
                                <Globe className="inline h-4 w-4" />
                                Publish Now
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUnpublish}
                                className="flex-2 cursor-pointer py-4"
                            >
                                <Eye className="inline h-4 w-4" />
                                Unpublish
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ViewPublicPostDetails;
