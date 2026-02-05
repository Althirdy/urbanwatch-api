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
import { toast } from '@/components/use-toast';
import { Contact } from '@/types/contacts-types';
import { router, useForm } from '@inertiajs/react';
import { Archive, MapPin, Phone, User } from 'lucide-react';
import React, { useState } from 'react';

const responderTypeColors: Record<string, string> = {
    Fire: 'bg-red-600  text-foreground',
    Emergency: 'bg-yellow-500 text-black',
    Crime: 'bg-zinc-700  text-foreground',
    Traffic: 'bg-orange-500 text-black',
    Barangay: 'bg-blue-500  text-foreground',
    Others: 'bg-gray-600  text-foreground',
};

interface DeleteContactsProps {
    contact: Contact;
    children?: React.ReactNode;
}

export default function DeleteContacts({
    contact,
    children,
}: DeleteContactsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirmText !== contact.branch_unit_name) {
            return;
        }

        destroy(`/contacts/${contact.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                setIsOpen(false);
                setConfirmText('');
                toast({
                    title: 'Success',
                    description: 'Contact archived successfully!',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description:
                        'An error occurred while archiving the contact.',
                    variant: 'destructive',
                });
            },
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
                        <Archive className="h-5 w-5" />
                        Archive Contact
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this contact? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-3 border-l-4 border-destructive/20 pl-4">
                        <div className="flex flex-row items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />

                            <h1 className="text-lg font-bold">
                                {contact.branch_unit_name}
                            </h1>
                            <Badge
                                className={`inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium ${responderTypeColors[
                                    contact.responder_type
                                    ] || 'bg-blue-100 text-blue-800'
                                    }`}
                            >
                                {contact.responder_type}
                            </Badge>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {contact.contact_person && (
                                <p>{contact.contact_person}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="text-muted-foreground">
                                        Address:
                                    </span>
                                    <p className="font-medium">
                                        {contact.location}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="text-muted-foreground">
                                        Primary Mobile:
                                    </span>
                                    <p className="font-medium">
                                        {contact.primary_mobile}
                                    </p>
                                </div>
                            </div>
                            {contact.backup_mobile && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <span className="text-muted-foreground">
                                            Backup Mobile:
                                        </span>
                                        <p className="font-medium">
                                            {contact.backup_mobile}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {contact.latitude && contact.longitude && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    Coordinates:
                                </span>
                                <p className="mt-1 rounded bg-muted p-1 font-mono text-xs">
                                    {contact.latitude}, {contact.longitude}
                                </p>
                            </div>
                        )}

                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Status:
                            </span>
                            <Badge
                                className={`ml-2 inline-flex items-center rounded-[var(--radius)] px-2 py-1 text-xs font-medium ${contact.active
                                        ? 'bg-green-800'
                                        : 'bg-gray-800'
                                    }`}
                            >
                                {contact.active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="archive-contact">
                            To confirm archiving, type{' '}
                            <span className="font-medium text-destructive">
                                {contact.branch_unit_name}
                            </span>{' '}
                            below:
                        </Label>
                        <div className="relative">
                            <Input
                                id="archive-contact"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Enter branch/unit name to confirm"
                                className={
                                    confirmText &&
                                        confirmText !== contact.branch_unit_name
                                        ? 'border-red-500'
                                        : ''
                                }
                            />
                            {confirmText &&
                                confirmText !== contact.branch_unit_name && (
                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                        Please type the exact branch/unit name
                                        to confirm
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
                            confirmText !== contact.branch_unit_name ||
                            processing
                        }
                        onClick={handleDelete}
                    >
                        {processing ? 'Archiving...' : 'Archive Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
