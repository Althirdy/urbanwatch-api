import { ColumnDef } from '@tanstack/react-table';
import { Archive, ArrowUpDown, ExternalLink, SquarePen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { Contact } from '@/types/contacts-types';
import DeleteContacts from './contacts-delete';
import EditContacts from './contacts-edit';
import ViewContacts from './contacts-view';
import { cn } from '@/lib/utils';

const responderTypeColors: Record<string, string> = {
    Fire: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    Emergency: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    Crime: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    Traffic: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    Barangay: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    Others: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
};

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
            const colorClass =
                responderTypeColors[responderType] ||
                'bg-blue-100 text-blue-800';

            return (
                <Badge
                    variant="outline"
                    className={`font-medium ${colorClass}`}
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
                        "font-medium",
                        active
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                            : "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20"
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
                <div className="flex justify-center gap-2">
                    <Tooltip>
                        <ViewContacts contact={contact}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </ViewContacts>
                        <TooltipContent>
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <EditContacts contact={contact}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <SquarePen className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </EditContacts>
                        <TooltipContent>
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
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2 border-red-500/20 bg-red-50/90 dark:bg-red-950/90 text-red-600 dark:text-red-400">
                            <p>Archive Contact</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
