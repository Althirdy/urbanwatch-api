import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/utils';
import {
    getStatusInfo,
    renderDetailItems,
} from '@/pages/reports-comp/reports-view';
import { PublicPost_T } from '@/types/public-post-types';
import { router } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    Globe,
    LocateFixed,
    Mail,
    MoveLeft,
    TriangleAlert,
    User,
} from 'lucide-react';

type ViewPublicPostDetailsProps = {
    post: PublicPost_T;
    children: React.ReactNode;
};

function ViewPublicPostDetails({ post, children }: ViewPublicPostDetailsProps) {
    const statusInfo = getStatusInfo(post.published_at);

    const handlePublish = () => {
        router.patch(
            `/public-post/${post.id}/publish`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleUnpublish = () => {
        router.patch(
            `/public-post/${post.id}/unpublish`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <SheetHeader>
                    <SheetTitle>Public Post Details</SheetTitle>
                    <SheetDescription className="flex flex-col gap-1">
                        <span>Post ID: #{post.id}</span>
                        <Badge
                            variant={statusInfo.variant}
                            className="w-fit text-sm"
                        >
                            {statusInfo.label}
                        </Badge>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex w-full flex-col justify-start gap-4 px-4 py-2">
                    {/* Report Preview */}
                    <div className="flex flex-col gap-2">
                        <p className="text-md font-medium">Report Snapshot</p>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>

                    {/* Report Content */}
                    <div className="flex flex-col gap-2">
                        <p className="text-md font-medium">Report Content</p>
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="mb-2 text-sm font-medium">
                                {post.report?.report_type}
                            </p>
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

                    {/* Publication Details */}
                    <div className="flex flex-col gap-2">
                        <p className="text-md font-medium">
                            Publication Details
                        </p>
                        {renderDetailItems([
                            {
                                icon: User,
                                text: `Published by: ${post.publishedBy?.name || 'Unknown'}`,
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

                    <div className="flex flex-col gap-2">
                        <p className="text-md font-medium">
                            Report Information
                        </p>
                        {renderDetailItems([
                            {
                                icon: User,
                                text: `Reporter: ${post.report?.user?.name || 'Unknown'}`,
                            },
                            {
                                icon: Mail,
                                text: `Email: ${post.report?.user?.email || 'No email provided'}`,
                            },
                            {
                                icon: LocateFixed,
                                text: `Location: ${post.report?.latitute || 'N/A'}, ${post.report?.longtitude || 'N/A'}`,
                            },
                            {
                                icon: TriangleAlert,
                                text: `Report Type: ${post.report?.report_type || 'Unknown'}`,
                            },
                        ])}
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <div className="flex w-full flex-col items-end justify-end gap-2">
                            {!post.published_at ? (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handlePublish}
                                    className="w-1/3 cursor-pointer py-6"
                                >
                                    <Globe className="mr-2 inline h-4 w-4" />
                                    Publish Now
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUnpublish}
                                    className="w-1/3 cursor-pointer py-6"
                                >
                                    <Eye className="mr-2 inline h-4 w-4" />
                                    Unpublish
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-1/4 cursor-pointer py-4"
                            >
                                <MoveLeft className="mr-2 inline h-4 w-4" />
                                Return
                            </Button>
                        </div>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default ViewPublicPostDetails;
