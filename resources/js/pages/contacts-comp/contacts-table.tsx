import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { Contact } from '@/types/contacts-types';
import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';

const ContactsTable = ({
    contacts,
    links,
    currentPage = 1,
    lastPage = 1,
}: {
    contacts: Contact[];
    links?: any[];
    currentPage?: number;
    lastPage?: number;
}) => {
    const getResponderTypeColor = (type: string) => {
        const colorMap: { [key: string]: string } = {
            BEST: 'bg-blue-100 text-blue-800',
            BCCM: 'bg-green-100 text-green-800',
            BCPC: 'bg-purple-100 text-purple-800',
            BDRRM: 'bg-red-100 text-red-800',
            BHERT: 'bg-orange-100 text-orange-800',
            BHW: 'bg-pink-100 text-pink-800',
            BPSO: 'bg-indigo-100 text-indigo-800',
            BTMO: 'bg-cyan-100 text-cyan-800',
            VAWC: 'bg-yellow-100 text-yellow-800',
        };
        return colorMap[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--sidebar)]">
            <Table className="m-0 border">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Contact ID
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Branch/Unit Name
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Responder Type
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Primary Number
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Location
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Status
                        </TableHead>
                        <TableHead className="py-4 text-center font-semibold">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No contacts found at the moment
                            </TableCell>
                        </TableRow>
                    ) : (
                        contacts.map((contact) => (
                            <TableRow
                                key={contact.id}
                                className="text-center text-muted-foreground"
                            >
                                <TableCell className="py-3">
                                    #{contact.id}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="font-medium">
                                        {contact.branch_unit_name}
                                    </div>
                                    {contact.contact_person && (
                                        <div className="text-xs text-muted-foreground">
                                            {contact.contact_person}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getResponderTypeColor(contact.responder_type)}`}
                                    >
                                        {contact.responder_type}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="font-medium">
                                        {contact.primary_mobile}
                                    </div>
                                    {contact.backup_mobile && (
                                        <div className="text-xs text-muted-foreground">
                                            Backup: {contact.backup_mobile}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="font-medium">
                                        {contact.location}
                                    </div>
                                    {contact.latitude && contact.longitude && (
                                        <div className="text-xs text-muted-foreground">
                                            {contact.latitude},{' '}
                                            {contact.longitude}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            contact.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        ●{' '}
                                        {contact.active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex justify-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <ViewContacts
                                                    contact={contact}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View Details</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <EditContacts
                                                    contact={contact}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Edit Contact</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DeleteContacts
                                                    contact={contact}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Delete Contact</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {links && links.length > 0 && (
                <Pagination className="flex justify-end border-t p-4">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href={links[0]?.url || '#'} />
                        </PaginationItem>
                        {links.map((link, index) => {
                            if (
                                link.label !== '&laquo; Previous' &&
                                link.label !== 'Next &raquo;' &&
                                link.url
                            ) {
                                return (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={link.active}
                                            href={link.url}
                                        >
                                            {link.label}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                        })}
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href={links[links.length - 1]?.url || '#'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default ContactsTable;
