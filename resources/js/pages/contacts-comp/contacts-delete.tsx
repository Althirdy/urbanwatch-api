import { Badge } from '@/components/ui/badge';
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
import { toast } from '@/components/use-toast';
import { Contact } from '@/types/contacts-types';
import { router, useForm } from '@inertiajs/react';
import { Archive, Phone, User, MapPin, Dot } from 'lucide-react';
import React, { useState } from 'react';
import { getResponderTypeCardColorClass, getStatusCardColorClass } from '@/lib/badgeStyles';



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
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive Contact
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this contact? This
                        action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">

                                <div className="min-w-0 flex flex-col gap-2">
                                    <h1 className="text-lg font-semibold truncate">
                                        {contact.branch_unit_name}
                                    </h1>
                                    <div className="text-xs flex gap-1 text-muted-foreground">
                                        <MapPin className="inline h-4 w-auto shrink-0" />
                                        <p className="truncate">{contact.location}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 text-xs font-medium px-1.5 ${getStatusCardColorClass(contact.active)}`}
                                >
                                    {contact.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-medium px-1.5 ${getResponderTypeCardColorClass(contact.responder_type)}`}
                                >
                                    {contact.responder_type}
                                </Badge>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-0 flex flex-col">
                            {/* Contact Person */}
                            {contact.contact_person && (
                                <div className="flex items-center gap-2  py-2">
                                    <User className="h-4 w-auto text-muted-foreground shrink-0" />
                                    <p className="font-medium text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                        {contact.contact_person}
                                    </p>
                                </div>
                            )}

                            {/* Phone Numbers */}
                            <div className="flex items-center py-2">
                                <Phone className="h-4 mr-2 w-auto text-muted-foreground shrink-0" />
                                <span className="font-medium text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                                    {contact.primary_mobile}
                                </span>
                                {contact.backup_mobile && (
                                    <>
                                        <Dot className="h-4 w-auto text-muted-foreground shrink-0" />
                                        <span className="font-medium text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                                            {contact.backup_mobile}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 py-2">
                        <Label htmlFor="archive-contact" className="text-sm text-muted-foreground">
                            To confirm archiving, type{' '}
                            <span className="font-bold text-destructive">
                                "{contact.branch_unit_name}"
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
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {confirmText &&
                                confirmText !== contact.branch_unit_name && (
                                    <span className="absolute -bottom-5 left-0 text-[10px] text-destructive">
                                        Name must match exactly
                                    </span>
                                )}
                        </div>
                    </div>
                </div>
                <AlertDialogFooter className="sm:justify-end gap-2 pt-2">
                    <AlertDialogCancel
                        onClick={() => setConfirmText('')}
                        disabled={processing}
                        className="cursor-pointer"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                            confirmText !== contact.branch_unit_name ||
                            processing
                        }
                        className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive Contact'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

