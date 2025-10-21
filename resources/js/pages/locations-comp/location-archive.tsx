import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { location_T } from '@/types/cctv-location-types';
import { useForm } from '@inertiajs/react';
import { Archive, MapPin } from 'lucide-react';
import { useState } from 'react';

interface DeleteLocationProps {
    location: location_T;
}

function DeleteLocation({ location }: DeleteLocationProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirmText !== location.location_name) {
            return;
        }

        destroy(`/locations/${location.id}`, {
            onSuccess: () => {
                setIsOpen(false);
                setConfirmText('');
            },
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer rounded-full p-2 hover:bg-destructive/20">
                    <Archive className="text-destructive" size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
                        <Archive className="h-5 w-5" />
                        Delete Location
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this location? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-3 border-l-4 border-destructive/20 pl-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <h1 className="text-lg font-bold">
                                        {location.location_name}
                                    </h1>
                                </div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    {location.landmark}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                    {location.location_category?.name}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    Barangay:
                                </span>
                                <p className="font-medium">
                                    {location.barangay}
                                </p>
                            </div>
                            {/*
                             <div className="flex items-center gap-1">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    Cameras:
                                </span>
                                <span className="font-medium">
                                    {location.cameras || 0}
                                </span>
                            </div> 
                            */}
                        </div>

                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Coordinates:
                            </span>
                            <p className="mt-1 rounded bg-muted p-1 font-mono text-xs">
                                {location.latitude}, {location.longitude}
                            </p>
                        </div>

                        {location.description && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    Description:
                                </span>
                                <p className="mt-1 text-sm italic opacity-90">
                                    {location.description}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delete-location">
                            To confirm deletion, type{' '}
                            <span className="font-medium text-destructive">
                                {location.location_name}
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
                </div>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setConfirmText('')}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={
                            confirmText !== location.location_name || processing
                        }
                        onClick={handleDelete}
                    >
                        {processing ? 'Deleting...' : 'Delete Location'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteLocation;
