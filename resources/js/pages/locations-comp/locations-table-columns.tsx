import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowUpDown,
    Cctv,
    ExternalLink,
    SquarePen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { location_T } from '@/types/location-types';
import DeleteLocation from './locations-archive';
import EditLocation from './locations-edit';
import ViewLocation from './locations-view';

export const columns = (): ColumnDef<location_T>[] => [
    {
        accessorKey: 'id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Location ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>#{row.getValue('id')}</div>,
    },
    {
        accessorKey: 'location_name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Location Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const location = row.original;
            return (
                <div>
                    <div className="font-medium">{location.location_name}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'barangay',
        header: 'Barangay',
        cell: ({ row }) => <div>{row.getValue('barangay')}</div>,
    },
    {
        id: 'cctv_count',
        header: 'CCTV Cameras',
        cell: ({ row }) => {
            const location = row.original;
            return (
                <div className="flex items-center justify-center gap-2">
                    <Cctv className="h-4 w-4 text-muted-foreground" />
                    <span>{location.cctv_count || 0} camera/s</span>
                </div>
            );
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
            const location = row.original;

            return (
                <div className="flex justify-center gap-2">
                    <Tooltip>
                        <ViewLocation location={location}>
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
                        </ViewLocation>
                        <TooltipContent>
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <EditLocation location={location}>
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
                        </EditLocation>
                        <TooltipContent>
                            <p>Edit Location</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <DeleteLocation location={location}>
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
                        </DeleteLocation>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2 border-red-500/20 bg-red-50/90 dark:bg-red-950/90 text-red-600 dark:text-red-400">
                            <p>Archive Location</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
