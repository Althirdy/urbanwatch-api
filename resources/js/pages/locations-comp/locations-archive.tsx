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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { location_T } from '@/types/location-types';
import { useForm } from '@inertiajs/react';
import { Archive } from 'lucide-react';
import { useState } from 'react';

type DeleteLocationProps = {
    location: location_T;
    children: React.ReactNode;
};

function DeleteLocation({ location, children }: DeleteLocationProps) {
    const [confirmText, setConfirmText] = useState('');
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirmText !== location.location_name) {
            return;
        }

        destroy(`/locations/${location.id}`, {
            onSuccess: () => {
                setConfirmText('');
            },
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex flex-row items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" /> Archive Location
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2">
                        Are you sure you want to archive{' '}
                        <span className="font-bold text-destructive">
                            {location.location_name}?
                        </span>{' '}
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2">
                    <Label
                        htmlFor="delete-location"
                        className="text-sm text-muted-foreground"
                    >
                        To confirm archiving, type{' '}
                        <span className="font-semibold">
                            "{location.location_name}"
                        </span>{' '}
                        below:
                    </Label>
                    <div className="relative">
                        <Input
                            id="delete-location"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Enter location name to confirm"
                            className={
                                confirmText &&
                                    confirmText !== location.location_name
                                    ? 'border-red-500'
                                    : ''
                            }
                        />
                        {confirmText &&
                            confirmText !== location.location_name && (
                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                    Please type the exact location name to
                                    confirm
                                </span>
                            )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="cursor-pointer"
                        onClick={() => setConfirmText('')}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                            confirmText !== location.location_name || processing
                        }
                        className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive Location'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteLocation;
