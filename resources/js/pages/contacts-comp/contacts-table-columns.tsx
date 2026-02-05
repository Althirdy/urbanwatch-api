import { ColumnDef } from '@tanstack/react-table';
import { Archive, ArrowUpDown, ExternalLink, SquarePen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { baseBadgeClasses, getResponderTypeColorClass, getStatusColorClass } from '@/lib/badgeStyles';
import { Contact } from '@/types/contacts-types';
import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';
import { cn } from '@/lib/utils';

export const columns = (): ColumnDef<Contact>[] => [
    {
        accessorKey: 'branch_unit_name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Branch/Unit Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const contact = row.original;
            return (
                <div>
                    <div className="font-medium">
                        {contact.branch_unit_name}
                    </div>
                    {contact.contact_person && (
                        <div className="text-xs text-muted-foreground">
                            {contact.contact_person}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'responder_type',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Responder Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const responderType = row.getValue('responder_type') as string;

            return (
                <Badge
                    variant="outline"
                    className={`${baseBadgeClasses} ${getResponderTypeColorClass(responderType)}`}
                >
                    {responderType}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'primary_mobile',
        header: 'Primary Number',
        cell: ({ row }) => {
            const contact = row.original;
            return (
                <div>
                    <div>{contact.primary_mobile}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
            const contact = row.original;
            return (
                <div>
                    <div className="font-medium">{contact.location}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.getValue('active') as boolean;
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        baseBadgeClasses,
                        getStatusColorClass(active ? 'active' : 'inactive')
                    )}
                >
                    {active ? 'Active' : 'Inactive'}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
            const contact = row.original;

            return (
                <div className="flex justify-center gap-1.5">
                    <Tooltip>
                        <ViewContacts contact={contact}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={(e) => e.stopPropagation()}
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
                                    onClick={(e) => e.stopPropagation()}
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
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                </Button>
                            </TooltipTrigger>
                        </DeleteContacts>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                            <p>Archive Contact</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
