import { Badge } from '@/components/ui/badge';
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
import { toast } from '@/components/use-toast';
import { cn } from '@/lib/utils';
import { PublicPost_T } from '@/types/public-post-types';
import { router, useForm } from '@inertiajs/react';
import { Calendar, Globe, ImageIcon, MoveLeft, Save, Trash2, User } from 'lucide-react';
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
    image: File | null;
    delete_image: boolean;
    _method: string;
};

function formatDateTimeForInput(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
}

function getStatusBadge(publishedAt: string | null) {
    if (!publishedAt) {
        return (
            <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                Draft
            </Badge>
        );
    }

    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
        return (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                Scheduled
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            Published
        </Badge>
    );
}

function EditPublicPost({ post, children }: EditPublicPostProps) {
    const { data, setData, post: postRequest, processing, errors } =
        useForm<EditPublicPostForm>({
            published_at: post.published_at || '',
            title: post.title || '',
            content: post.content || '',
            category: post.category?.toLowerCase() || 'announcement',
            image: null,
            delete_image: false,
            _method: 'PUT',
        });

    const [scheduleMode, setScheduleMode] = useState(
        !!post.published_at && new Date(post.published_at) > new Date(),
    );
    const [publishNow, setPublishNow] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(post.image_path || null);
    const [isOpen, setIsOpen] = useState(false);

    const isPublished =
        post.published_at && new Date(post.published_at) <= new Date();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                image: file,
                delete_image: false
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setData((prev) => ({
            ...prev,
            image: null,
            delete_image: true
        }));
        setImagePreview(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        let finalPublishedAt = data.published_at;
        let finalStatus = post.status;

        if (publishNow) {
            finalPublishedAt = new Date().toISOString();
            finalStatus = 'published';
        } else if (scheduleMode) {
            finalStatus = 'scheduled';
        } else if (!isPublished) {
            finalPublishedAt = '';
            finalStatus = 'draft';
        }

        postRequest(`/public-post/${post.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                toast({
                    title: "Success",
                    description: "Public post updated successfully.",
                    variant: "default",
                });
                setIsOpen(false);
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update public post. Please check the form.",
                    variant: "destructive",
                });
            },
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b dark:border-zinc-800">
                        <div className="flex flex-row items-center gap-4">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    Edit Public Post #{post.id}
                                </h3>
                                <div className="mt-1 flex gap-2 items-center">
                                    {getStatusBadge(post.published_at)}
                                    <Badge variant="secondary" className="uppercase text-[10px]">
                                        {data.category}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex w-full flex-1 flex-col justify-start gap-6 overflow-y-auto px-6 py-4">
                        <div className="flex w-full flex-col gap-6">
                            {/* Image Section */}
                            <div className="grid gap-3">
                                <Label className="text-sm font-medium">Post Image</Label>
                                <div className="relative group aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => document.getElementById('edit-image-upload')?.click()}
                                                >
                                                    Change
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={removeImage}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => document.getElementById('edit-image-upload')?.click()}
                                        >
                                            <ImageIcon className="h-10 w-10" />
                                            <span className="text-xs">Click to upload image</span>
                                        </div>
                                    )}
                                    <input
                                        id="edit-image-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
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
                                <div className="grid gap-1.5">
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="Enter post title"
                                        className={cn(errors.title && "border-red-500")}
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
                                <div className="grid gap-1.5">
                                    <textarea
                                        id="content"
                                        value={data.content}
                                        onChange={(e) =>
                                            setData('content', e.target.value)
                                        }
                                        placeholder="Enter post content"
                                        rows={6}
                                        className={cn(
                                            "w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950",
                                            errors.content ? "border-red-500 focus:ring-red-500" : "border-input"
                                        )}
                                    />
                                    {errors.content && (
                                        <span className="text-xs text-red-500">
                                            {errors.content}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Publication Settings */}
                            {!isPublished && (
                                <div className="flex w-full flex-col gap-4 p-4 rounded-lg bg-muted/30 border border-dashed">
                                    <p className="text-sm font-semibold">Publication Settings</p>

                                    <div className="grid gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="publish-now"
                                                checked={publishNow}
                                                onCheckedChange={(checked: boolean) => {
                                                    setPublishNow(checked);
                                                    if (checked) setScheduleMode(false);
                                                }}
                                            />
                                            <Label
                                                htmlFor="publish-now"
                                                className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                                            >
                                                <Globe className="h-4 w-4 text-blue-500" />
                                                Publish immediately
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="schedule-mode"
                                                checked={scheduleMode}
                                                onCheckedChange={(checked: boolean) => {
                                                    setScheduleMode(checked);
                                                    if (checked) setPublishNow(false);
                                                }}
                                            />
                                            <Label
                                                htmlFor="schedule-mode"
                                                className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                                            >
                                                <Calendar className="h-4 w-4 text-amber-500" />
                                                Schedule for later
                                            </Label>
                                        </div>

                                        {scheduleMode && (
                                            <div className="grid gap-2 pl-6">
                                                <Label htmlFor="published_at" className="text-xs">
                                                    Schedule Date & Time
                                                </Label>
                                                <Input
                                                    id="published_at"
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(data.published_at)}
                                                    onChange={(e) => {
                                                        const date = e.target.value
                                                            ? new Date(e.target.value).toISOString()
                                                            : '';
                                                        setData('published_at', date);
                                                    }}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                    className={cn(errors.published_at && "border-red-500")}
                                                />
                                                {errors.published_at && (
                                                    <span className="text-xs text-red-500">
                                                        {errors.published_at}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Post Metadata */}
                            <div className="flex flex-col gap-3 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Published by: {post.publishedBy?.name || 'Barangay Office'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                                {post.published_at && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5" />
                                        <span>Current publish date: {new Date(post.published_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 px-6 py-4 border-t dark:border-zinc-800">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <MoveLeft className="inline h-4 w-4 mr-1" />
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-[2]"
                            >
                                {processing ? (
                                    <Spinner className="inline h-4 w-4 mr-1" />
                                ) : (
                                    <Save className="inline h-4 w-4 mr-1" />
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
