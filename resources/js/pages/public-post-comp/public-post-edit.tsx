import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { PublicPost_T } from '@/types/public-post-types';
import { router, useForm } from '@inertiajs/react';
import { Calendar, Globe, MoveLeft, Save, User } from 'lucide-react';
import { FormEvent, useState } from 'react';

type EditPublicPostProps = {
    post: PublicPost_T;
    children: React.ReactNode;
};

type EditPublicPostForm = {
    published_at: string;
    title: string;
    content: string;
    category: string;
};

const reportTypeColors: Record<string, string> = {
    CCTV: 'bg-blue-800',
    'Citizen Concern': 'bg-purple-800',
    Emergency: 'bg-red-800',
    Announcement: 'bg-yellow-800',
};

function formatDateTimeForInput(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
}

function getStatusBadge(publishedAt: string | null) {
    if (!publishedAt) {
        return (
            <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20">
                Draft
            </Badge>
        );
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                Scheduled
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
            Published
        </Badge>
    );
}

function EditPublicPost({ post, children }: EditPublicPostProps) {
    const { data, setData, put, processing, errors, reset } =
        useForm<EditPublicPostForm>({
            published_at: post.published_at || '',
            title: post.title || '',
            content: post.content || '',
            category: post.category?.toLowerCase() || 'announcement',
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
        } else if (!scheduleMode && !isPublished) {
            finalPublishedAt = '';
        }

        // Submit the form using router with the correct data
        router.put(
            `/public-post/${post.id}`,
            {
                title: data.title,
                content: data.content,
                category: data.category.toLowerCase(),
                published_at: finalPublishedAt,
                status: publishNow ? 'published' : (scheduleMode ? 'scheduled' : (isPublished ? 'published' : 'draft')),
            },
            {
                onSuccess: () => {
                    const closeButton = document.querySelector(
                        '[data-dialog-close]',
                    ) as HTMLButtonElement;
                    if (closeButton) closeButton.click();
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
                <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <div className="flex flex-row items-center gap-4">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    Edit Public Post #{post.id}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    {data.category}
                                </p>
                                <div className="mt-1">
                                    {getStatusBadge(post.published_at)}
                                    {/* <span
                                        className={`inline-flex items-center rounded-[var(--radius)] px-2.5 py-0.5 text-sm font-medium ${reportTypeColors[
                                            post.report?.report_type || ''
                                            ] || 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {post.report?.report_type}
                                    </span> */}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex w-full flex-1 flex-col justify-start gap-6 overflow-y-auto px-6 py-4">
                        {/* Post Content - Editable */}
                        <div className="flex w-full flex-col gap-4">
                            <div className="grid gap-3">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Post Content
                                </p>
                            </div>

                            {/* Category Selector */}
                            <div className="grid gap-3">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(value) =>
                                        setData('category', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="announcement">Announcement</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                        <SelectItem value="news">News</SelectItem>
                                        <SelectItem value="advisory">Advisory</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Editable Title */}
                            <div className="grid gap-3">
                                <Label htmlFor="title">Title</Label>
                                <div className="relative">
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="Enter post title"
                                        className={
                                            errors.title ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.title && (
                                        <span className="text-xs text-red-500">
                                            {errors.title}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Editable Content */}
                            <div className="grid gap-3">
                                <Label htmlFor="content">Content</Label>
                                <div className="relative">
                                    <textarea
                                        id="content"
                                        value={data.content}
                                        onChange={(e) =>
                                            setData(
                                                'content',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter post content"
                                        rows={8}
                                        className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none ${errors.content
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-input'
                                            }`}
                                    />
                                    {errors.content && (
                                        <span className="text-xs text-red-500">
                                            {errors.content}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Source Details (if linked) */}
                            {post.postable && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        Original Source
                                    </p>
                                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                        <p>Type: {post.postable_type?.split('\\').pop()}</p>
                                        <p>Source ID: #{post.postable_id}</p>
                                    </div>
                                </div>
                            )}

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
                                            {post.publishedBy?.name || 'Barangay Office'}
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
                    </div>

                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-dialog-close
                                    className="flex-1 cursor-pointer"
                                >
                                    <MoveLeft className="inline h-4 w-4" />
                                    Close
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-2 cursor-pointer"
                            >
                                {processing ? (
                                    <Spinner className="inline h-4 w-4" />
                                ) : (
                                    <Save className="inline h-4 w-4" />
                                )}
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditPublicPost;
