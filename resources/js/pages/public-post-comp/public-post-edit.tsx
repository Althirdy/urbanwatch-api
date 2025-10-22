import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTrigger,
} from '@/components/ui/sheet';
import { PublicPost_T } from '@/types/public-post-types';
import { router, useForm } from '@inertiajs/react';
import { Calendar, Globe, MoveLeft, TriangleAlert, User } from 'lucide-react';
import { FormEvent, useState } from 'react';

type EditPublicPostProps = {
    post: PublicPost_T;
    children: React.ReactNode;
};

type EditPublicPostForm = {
    published_at: string;
    transcript: string;
    description: string;
};

function getStatusBadge(publishedAt: string | null) {
    if (!publishedAt) {
        return (
            <Badge variant="outline" className="text-gray-500">
                Draft
            </Badge>
        );
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return (
            <Badge variant="secondary" className="text-blue-600">
                Scheduled
            </Badge>
        );
    }

    return (
        <Badge variant="default" className="bg-green-600 text-white">
            Published
        </Badge>
    );
}

function EditPublicPost({ post, children }: EditPublicPostProps) {
    const { data, setData, put, processing, errors, reset } =
        useForm<EditPublicPostForm>({
            published_at: post.published_at || '',
            transcript: post.report?.transcript || '',
            description: post.report?.description || '',
        });

    const [scheduleMode, setScheduleMode] = useState(
        !!post.published_at && new Date(post.published_at) > new Date(),
    );
    const [publishNow, setPublishNow] = useState(false);

    // Check if post is already published
    const isPublished =
        post.published_at && new Date(post.published_at) <= new Date();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Determine the final published_at value
        let finalPublishedAt = data.published_at;

        if (publishNow) {
            finalPublishedAt = new Date().toISOString();
        } else if (!scheduleMode) {
            finalPublishedAt = '';
        }

        // Submit the form using router with the correct data
        router.put(
            `/public-post/${post.id}`,
            {
                transcript: data.transcript,
                description: data.description,
                published_at: finalPublishedAt,
            },
            {
                onSuccess: () => {
                    const closeButton = document.querySelector(
                        '[data-sheet-close]',
                    ) as HTMLButtonElement;
                    if (closeButton) closeButton.click();
                },
                preserveScroll: true,
            },
        );
    };
    const formatDateTimeForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <div className="flex flex-row items-center gap-4">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    Edit Public Post #{post.id}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {post.report?.report_type}
                                </p>
                                <div className="mt-1">
                                    {getStatusBadge(post.published_at)}
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex w-full flex-col justify-start gap-6 px-4 py-2">
                        {/* Report Content - Editable */}
                        <div className="flex w-full flex-col gap-4">
                            <div className="grid gap-3">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Report Content
                                </p>
                            </div>

                            {/* Report Type and Reporter Info (Read-only) */}
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="mb-2 flex items-center gap-2">
                                    <TriangleAlert className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        {post.report?.report_type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>
                                        Reported by:{' '}
                                        {post.report?.user?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Editable Transcript */}
                            <div className="grid gap-3">
                                <Label htmlFor="transcript">Transcript</Label>
                                <div className="relative">
                                    <textarea
                                        id="transcript"
                                        value={data.transcript}
                                        onChange={(e) =>
                                            setData(
                                                'transcript',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter report transcript or summary"
                                        rows={4}
                                        className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none ${
                                            errors.transcript
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    {errors.transcript && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.transcript}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Editable Description */}
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter detailed description of the incident"
                                        rows={6}
                                        className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none ${
                                            errors.description
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    {errors.description && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Publication Settings */}
                        {!isPublished && (
                            <div className="flex w-full flex-col gap-4">
                                <div className="grid gap-3">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        Publication Settings
                                    </p>
                                </div>

                                {/* Publish Now Option */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="publish-now"
                                        checked={publishNow}
                                        onCheckedChange={(checked: boolean) => {
                                            setPublishNow(checked);
                                            if (checked) {
                                                setScheduleMode(false);
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor="publish-now"
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Globe className="h-4 w-4" />
                                        Publish immediately
                                    </Label>
                                </div>

                                {/* Schedule Option */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="schedule-mode"
                                        checked={scheduleMode}
                                        onCheckedChange={(checked: boolean) => {
                                            setScheduleMode(checked);
                                            if (checked) {
                                                setPublishNow(false);
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor="schedule-mode"
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        Schedule for later
                                    </Label>
                                </div>

                                {/* Schedule Date/Time Input */}
                                {scheduleMode && (
                                    <div className="grid gap-3">
                                        <Label htmlFor="published_at">
                                            Schedule Date & Time
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="published_at"
                                                type="datetime-local"
                                                value={
                                                    data.published_at
                                                        ? formatDateTimeForInput(
                                                              data.published_at,
                                                          )
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const date = e.target.value
                                                        ? new Date(
                                                              e.target.value,
                                                          ).toISOString()
                                                        : '';
                                                    setData(
                                                        'published_at',
                                                        date,
                                                    );
                                                }}
                                                min={new Date()
                                                    .toISOString()
                                                    .slice(0, 16)}
                                                className={
                                                    errors.published_at
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : ''
                                                }
                                            />
                                            {errors.published_at && (
                                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                    {errors.published_at}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Post Metadata (Read-only) */}
                        <div className="flex flex-col gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Post Information
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                <div className="flex flex-row items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>
                                        Published by:{' '}
                                        {post.publishedBy?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        Created:{' '}
                                        {new Date(
                                            post.created_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                {post.published_at && (
                                    <div className="flex flex-row items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <span>
                                            Current publish date:{' '}
                                            {new Date(
                                                post.published_at,
                                            ).toLocaleDateString()}{' '}
                                            at{' '}
                                            {new Date(
                                                post.published_at,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="px-4">
                        <div className="flex w-full flex-row justify-end gap-2">
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-sheet-close
                                    className="cursor-pointer"
                                >
                                    <MoveLeft className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default EditPublicPost;
