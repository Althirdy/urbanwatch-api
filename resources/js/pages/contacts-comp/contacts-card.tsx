import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { Contact } from '@/types/contacts-types';
import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';

const ContactsCard = ({ contacts }: { contacts: Contact[] }) => {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {contacts.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-[var(--radius)] border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        No contacts found at the moment
                    </p>
                </div>
            ) : (
                contacts.map((contact) => (
                    <Card
                        key={contact.id}
                        className="relative overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                    >
                        <CardHeader>
                            <CardTitle>{contact.branch_unit_name}</CardTitle>
                            <CardDescription>
                                {contact.primary_mobile}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">
                                    Responder Type & Location
                                </p>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {contact.responder_type} at{' '}
                                    {contact.location}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ViewContacts contact={contact} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>View Details</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <EditContacts contact={contact} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Edit Contact</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DeleteContacts contact={contact} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Delete Contact</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
    );
};

export default ContactsCard;
