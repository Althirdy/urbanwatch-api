import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/use-toast';
import axios from 'axios';
import { store as storePublicPost } from '@/routes/public-post';

// Define the form data type
interface PublicPostFormData {
    title: string;
    content: string;
    category: string;
    status: 'draft' | 'published' | 'scheduled';
    published_at?: Date;
    image?: File;
}

export default function CreatePublicPostModal() {
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<PublicPostFormData>({
        defaultValues: {
            title: '',
            content: '',
            category: 'General',
            status: 'published',
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        form.setValue('image', undefined);
        setPreview(null);
    };

    const onSubmit = async (data: PublicPostFormData) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('category', data.category);
            formData.append('status', data.status);
            
            if (data.status === 'scheduled' && data.published_at) {
                // Format date as YYYY-MM-DD HH:mm:ss for Laravel
                formData.append('published_at', format(data.published_at, 'yyyy-MM-dd HH:mm:ss'));
            }

            if (data.image) {
                formData.append('image', data.image);
            }

            await axios.post(storePublicPost().url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast({
                title: "Success",
                description: "Public post created successfully",
            });
            setOpen(false);
            form.reset();
            setPreview(null);
            router.reload(); // Refresh the page data
        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key: any) => {
                    form.setError(key, { message: errors[key][0] });
                });
                toast({
                    title: "Error",
                    description: "Please check the form for errors",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || 'Failed to create post',
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer px-4 py-2">
                    <Plus /> Create Post
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Public Post</DialogTitle>
                    <DialogDescription>
                        Create a new announcement or update for the public.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image Upload Section - Visually prominent */}
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div 
                            className={cn(
                                "relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted",
                                preview && "border-none p-0"
                            )}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            {preview ? (
                                <>
                                    <img 
                                        src={preview} 
                                        alt="Preview" 
                                        className="h-full w-full rounded-lg object-cover"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-2 top-2 h-8 w-8 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                                        <ImagePlus className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click to upload cover image</p>
                                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or WEBP (max. 5MB)</p>
                                    </div>
                                </div>
                            )}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Title
                            </label>
                            <Input
                                placeholder="Enter post title"
                                {...form.register('title', { required: 'Title is required' })}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Content
                            </label>
                            <Textarea
                                placeholder="Write your post content here..."
                                className="min-h-[150px]"
                                {...form.register('content', { required: 'Content is required' })}
                            />
                            {form.formState.errors.content && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.content.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Category
                                </label>
                                <Select
                                    onValueChange={(value) => form.setValue('category', value)}
                                    defaultValue={form.getValues('category')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="News">News</SelectItem>
                                        <SelectItem value="Alert">Alert</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Status
                                </label>
                                <Select
                                    onValueChange={(value: any) => form.setValue('status', value)}
                                    defaultValue={form.getValues('status')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="published">Publish Immediately</SelectItem>
                                        <SelectItem value="draft">Save as Draft</SelectItem>
                                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Scheduled Date - Only show if status is scheduled */}
                        {form.watch('status') === 'scheduled' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Publication Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !form.watch('published_at') && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.watch('published_at') ? (
                                                format(form.watch('published_at')!, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={form.watch('published_at')}
                                            onSelect={(date) => form.setValue('published_at', date)}
                                            initialFocus
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {form.formState.errors.published_at && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.published_at.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {form.watch('status') === 'published' ? 'Publish Now' : 
                         form.watch('status') === 'scheduled' ? 'Schedule Post' : 'Save Draft'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
