import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Contact } from '@/types/contacts-types';
import { Archive, ExternalLink, MapPin, Phone, SquarePen, } from 'lucide-react';

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
                    className="group relative  overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                    <CardContent >
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
                        <div className="space-y-1 ">
                            {/* Contact Person */}
                            {contact.contact_person && (
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Contact Person</p>
                                        <p className="font-medium text-xs text-zinc-600 dark:text-zinc-400 truncate">{contact.contact_person}</p>
                                    </div>
                                </div>
                            )}

                            {/* Phone Numbers */}
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Primary</p>
                                    <span className="font-medium text-xs text-zinc-600 dark:text-zinc-400 family-mono">{contact.primary_mobile}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter>
                        {/* Action Buttons - Premium Footer */}
                        <div className="flex w-full justify-end gap-2 pt-2 border-t dark:border-zinc-800">
                            <Tooltip>
                                <ViewContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <ExternalLink className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </ViewContacts>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>View Details</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <EditContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                </EditContacts>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                    <p>Edit Contact</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <DeleteContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                        >
                                            <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                        </Button>
                                    </TooltipTrigger>
                                </DeleteContacts>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2 ">
                                    <p>Archive Contact</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default ContactCard;
