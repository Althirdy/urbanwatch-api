import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Contact } from '@/types/contacts-types';
import { ExternalLink, MapPin, Phone, SquarePen, Trash2,  } from 'lucide-react';

import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';

// Responder type badge styles
const getResponderTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
        case 'fire':
            return 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/30';
        case 'emergency':
            return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30';
        case 'crime':
            return 'bg-zinc-500/15 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300 border-zinc-500/30';
        case 'traffic':
            return 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/30';
        case 'barangay':
            return 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/30';
        default:
            return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
    }
};

// Status badge styles
const getStatusStyles = (active: boolean) => {
    return active
        ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30'
        : 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
};

const ContactCard = ({ contacts }: { contacts: Contact[] }) => {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contacts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <Phone className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-foreground">No contacts found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {contacts.map((contact) => (
                <Card
                    key={contact.id}
                    className="group relative py-0 overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                    <CardContent className="p-6">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">

                                <div className="min-w-0 flex flex-col gap-1">
                                    <h3 className="truncate font-semibold leading-tight">
                                        {contact.branch_unit_name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{contact.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 text-xs font-medium px-1.5 py-0.5 ${getStatusStyles(contact.active)}`}
                                >
                                    {contact.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-medium px-1.5 py-0.5 ${getResponderTypeStyles(contact.responder_type)}`}
                                >
                                    {contact.responder_type}
                                </Badge>
                            </div>

                        </div>

                        {/* Contact Info - Compact */}
                        <div className="space-y-2 mb-3">
                            {/* Contact Person */}
                            {contact.contact_person && (
                                <div className=" bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact Person</p>
                                    <p className="font-medium text-xs truncate">{contact.contact_person}</p>
                                </div>
                            )}

                            {/* Phone Numbers */}
                            <div className=" bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Primary</p>
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium text-xs">{contact.primary_mobile}</span>
                                </div>
                                {contact.backup_mobile && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Backup: {contact.backup_mobile}
                                    </p>
                                )}
                            </div>

                        </div>

                        {/* Action Buttons - Compact */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t dark:border-zinc-800">
                            <Tooltip>
                                <ViewContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </ViewContacts>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">View Details</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <EditContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                        >
                                            <SquarePen className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </EditContacts>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">Edit Contact</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <DeleteContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </DeleteContacts>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">Delete Contact</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default ContactCard;
