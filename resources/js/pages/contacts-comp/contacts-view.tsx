import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useIdentifyNumber } from '@/hooks/use-identify-number';
import { Contact } from '@/types/contacts-types';
import { MoveLeft } from 'lucide-react';
import React from 'react';

interface ViewContactsProps {
    contact: Contact;
    children?: React.ReactNode;
}

// Network provider color configurations
const networkColors: Record<
    string,
    { bg: string; text: string; border: string }
> = {
    Globe: {
        bg: 'bg-[#23308F]',
        text: ' text-foreground',
        border: 'border-[#23308F]',
    },
    Smart: {
        bg: 'bg-[#099343]',
        text: ' text-foreground',
        border: 'border-[#099343]',
    },
    TNT: {
        bg: 'bg-[#FD9D22]',
        text: 'text-[#D7E600]',
        border: 'border-[#D7E600]',
    },
    'Sun Cellular': {
        bg: 'bg-[#FDB810]',
        text: 'text-[#ED2C2B]',
        border: 'border-[#FDB810]',
    },
    DITO: {
        bg: 'bg-[#CD1025]',
        text: ' text-foreground',
        border: 'border-[#CD1025]',
    },
    Unknown: {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-muted',
    },
};

const responderTypeColors: Record<string, string> = {
    Fire: 'bg-red-600  text-foreground',
    Emergency: 'bg-yellow-500 text-black',
    Crime: 'bg-zinc-800  text-foreground',
    Traffic: 'bg-orange-500 text-black',
    Barangay: 'bg-blue-500  text-foreground',
    Others: 'bg-gray-600  text-foreground',
};

export default function ViewContacts({ contact, children }: ViewContactsProps) {
    // Build full name from contact person or branch name
    const getDisplayName = () => {
        if (contact.contact_person) {
            return contact.contact_person;
        }
        return contact.branch_unit_name;
    };

    // Get initials from contact person or branch name
    const getInitials = () => {
        const name = contact.contact_person || contact.branch_unit_name || '';
        const nameParts = name.split(' ').filter(Boolean);
        if (nameParts.length >= 2) {
            return (
                nameParts[0].charAt(0).toUpperCase() +
                nameParts[nameParts.length - 1].charAt(0).toUpperCase()
            );
        }
        return name.charAt(0).toUpperCase() || '?';
    };

    // Phone number network identification
    const primaryPhoneInfo = useIdentifyNumber(contact.primary_mobile || '');
    const backupPhoneInfo = useIdentifyNumber(contact.backup_mobile || '');

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <DialogHeader className="flex-shrink-0 px-6 pt-6">
                    <DialogTitle>Contact Details</DialogTitle>
                    <DialogDescription>
                        View detailed information about this contact person.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full flex-1 flex-col justify-start gap-10 overflow-y-auto px-6 py-4">
                    <div className="flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex w-full flex-row justify-between">
                            <div className="flex flex-col justify-center">
                                <h3 className="text-xl font-semibold">
                                    {getDisplayName()}
                                </h3>
                                {contact.branch_unit_abbreviation && (
                                    <span className="text-md font-normal text-muted-foreground">
                                        {contact.branch_unit_abbreviation}
                                    </span>
                                )}
                                {contact.contact_person && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {contact.branch_unit_name}
                                    </span>
                                )}

                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium text-foreground ${contact.active
                                        ? 'bg-green-800 dark:bg-green-900'
                                        : 'bg-gray-800'
                                        }`}
                                >
                                    {contact.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${responderTypeColors[
                                        contact.responder_type
                                    ] || 'bg-blue-100 text-blue-800'
                                        }`}
                                >
                                    {contact.responder_type}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid auto-rows-min gap-6">
                        {/* Contact Numbers in a row */}
                        <div className="flex flex-col">
                            <span className="text-sm text-foreground">
                                Contact Information
                            </span>
                            <div className="flex w-full flex-row justify-between gap-3">
                                <div className="w-full space-y-2">
                                    <Label
                                        htmlFor="primary-mobile"
                                        className="text-muted-foreground"
                                    >
                                        Primary Contact
                                    </Label>
                                    <div className="relative flex items-center">
                                        <Input
                                            id="primary-mobile"
                                            value={contact.primary_mobile}
                                            readOnly
                                            tabIndex={-1}
                                            className="cursor-not-allowed border-none bg-muted pr-20 select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                        />
                                        {primaryPhoneInfo.network !==
                                            'Unknown' && (
                                                <Badge
                                                    className={`${networkColors[primaryPhoneInfo.carrier]?.bg || networkColors[primaryPhoneInfo.network]?.bg} ${networkColors[primaryPhoneInfo.carrier]?.text || networkColors[primaryPhoneInfo.network]?.text} ${networkColors[primaryPhoneInfo.carrier]?.border || networkColors[primaryPhoneInfo.network]?.border} absolute right-2 rounded-[var(--radius)] border`}
                                                >
                                                    {primaryPhoneInfo.carrier}
                                                </Badge>
                                            )}
                                    </div>
                                </div>
                                <div className="w-full space-y-2">
                                    <Label
                                        htmlFor="backup-mobile"
                                        className="text-muted-foreground"
                                    >
                                        Backup Contact
                                    </Label>
                                    <div className="relative flex items-center">
                                        <Input
                                            id="backup-mobile"
                                            value={
                                                contact.backup_mobile || 'N/A'
                                            }
                                            readOnly
                                            tabIndex={-1}
                                            className="cursor-not-allowed border-none bg-muted pr-20 select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                        />
                                        {contact.backup_mobile &&
                                            backupPhoneInfo.network !==
                                            'Unknown' && (
                                                <Badge
                                                    className={`${networkColors[backupPhoneInfo.carrier]?.bg || networkColors[backupPhoneInfo.network]?.bg} ${networkColors[backupPhoneInfo.carrier]?.text || networkColors[backupPhoneInfo.network]?.text} ${networkColors[backupPhoneInfo.carrier]?.border || networkColors[backupPhoneInfo.network]?.border} absolute right-2 rounded-[var(--radius)] border`}
                                                >
                                                    {backupPhoneInfo.carrier}
                                                </Badge>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Created Date */}
                        {contact.created_at && (
                            <div className="grid gap-3">
                                <Label htmlFor="created">Created Date</Label>
                                <Input
                                    id="created"
                                    value={new Date(
                                        contact.created_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                    readOnly
                                    tabIndex={-1}
                                    className="cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex-shrink-0 px-6 pb-4">
                    <DialogClose asChild>
                        <Button variant="outline">
                            <MoveLeft className="h-6 w-6" />
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
