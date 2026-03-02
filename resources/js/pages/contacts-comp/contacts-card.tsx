import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Contact } from '@/types/contacts-types';
import { Archive, Dot, ExternalLink, Phone, SquarePen, User } from 'lucide-react';

import { baseBadgeClasses, getResponderTypeColorClass, getStatusColorClass } from '@/lib/badgeStyles';
import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';

const ContactCard = ({ contacts }: { contacts: Contact[] }) => {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contacts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <Phone className="mb-3 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="text-sm font-medium text-foreground">No contacts found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {contacts.map((contact) => (
                <Card
                    key={contact.id}
                    className="group relative overflow-hidden border bg-card transition-all duration-200 hover:border-primary/20 hover:shadow-md"
                >
                    <CardContent className="space-y-3 p-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="min-w-0">
                                    <span className="truncate text-sm font-semibold">
                                        {contact.branch_unit_name}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        baseBadgeClasses,
                                        getStatusColorClass(contact.active ? 'active' : 'inactive'),
                                    )}
                                >
                                    {contact.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={cn(baseBadgeClasses, getResponderTypeColorClass(contact.responder_type))}
                                >
                                    {contact.responder_type}
                                </Badge>
                            </div>
                        </div>

                        {/* Contact Info - Compact */}
                        <div className="flex flex-col space-y-2">
                            {/* Contact Person */}
                            {contact.contact_person && (
                                <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <p className="truncate text-xs font-medium text-muted-foreground">{contact.contact_person}</p>
                                    </div>
                                </div>
                            )}

                            {/* Phone Numbers */}
                            <div className="flex min-w-0 items-center rounded-md border bg-muted/30 px-2 py-1.5">
                                <Phone className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                    <span className="font-mono text-xs font-medium text-muted-foreground">{contact.primary_mobile}</span>
                                </div>

                                {contact.backup_mobile && (
                                    <>
                                        <Dot className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <span className="font-mono text-xs font-medium text-muted-foreground">{contact.backup_mobile}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="border-t p-3">
                        {/* Action Buttons - Premium Footer */}
                        <div className="flex w-full justify-end gap-2">
                            <Tooltip>
                                <ViewContacts contact={contact}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 cursor-pointer p-0"
                                        >
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                                            className="h-8 w-8 cursor-pointer p-0"
                                        >
                                            <SquarePen className="h-4 w-4 text-muted-foreground" />
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
                                            className="group h-8 w-8 cursor-pointer p-0"
                                        >
                                            <Archive className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-destructive" />
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
