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
import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { PublicPost_T } from '@/types/public-post-types';

type ResolvePublicPostProps = {
    post: PublicPost_T;
    children: ReactNode;
};

export default function ResolvePublicPost({ post, children }: ResolvePublicPostProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleResolve = () => {
        setIsLoading(true);
        router.patch(
            `/public-post/${post.id}/resolve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.flushAll(); // Clear prefetch cache to prevent stale data
                    setOpen(false);
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            }
        );
    };

    // Check if the post can be resolved
    const canResolve =
        post.postable &&
        post.postable.status === 'ongoing' &&
        post.postable_type === 'App\\Models\\Accident';

    // Don't show resolve button if not applicable
    if (!canResolve) {
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Resolve Accident
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to mark this accident as resolved? This will:
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                            <li>Update the accident status to "Resolved"</li>
                            <li>Add [RESOLVED] prefix to the post title</li>
                            <li>Notify the public that the issue has been addressed</li>
                        </ul>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleResolve}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? 'Resolving...' : 'Mark as Resolved'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
