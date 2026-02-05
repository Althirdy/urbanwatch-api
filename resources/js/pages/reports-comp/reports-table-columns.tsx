import { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowUpDown,
    Check,
    CheckCircle,
    ExternalLink as Open,
    SquarePen,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { baseBadgeClasses, getReportTypeColorClass, getStatusColorClass } from '@/lib/badgeStyles';
import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import ArchiveReport from './reports-archive';
import EditReport from './reports-edit';
import ViewReportDetails from './reports-view';

export const columns = (reportTypes: string[]): ColumnDef<reports_T>[] => [
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
                    Report ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>#{row.getValue('id')}</div>,
    },
    {
        accessorKey: 'report_type',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Report Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const reportType = row.getValue('report_type') as string;

            return (
                <Badge
                    variant="outline"
                    className={`${baseBadgeClasses} ${getReportTypeColorClass(reportType)}`}
                >
                    {reportType}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'transcript',
        header: 'Report',
        cell: ({ row }) => <div>{row.getValue('transcript')}</div>,
    },
    {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
            const report = row.original;
            return (
                <div>
                    {Number(report.latitude).toFixed(2)},{' '}
                    {Number(report.longitude).toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="cursor-pointer transition-colors duration-200 ease-in-out"
                >
                    Date and Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            return <div>{formatDateTime(row.getValue('created_at'))}</div>;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;

            return (
                <Badge
                    variant="outline"
                    className={`${baseBadgeClasses} ${getStatusColorClass(status)}`}
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row, table }) => {
            const report = row.original;
            const reportTypes = (table.options.meta as any)?.reportTypes || [];

            const handleAcknowledge = () => {
                router.patch(`/report/${report.id}/acknowledge`, {}, {
                    preserveScroll: true,
                });
            };

            const handleResolve = () => {
                router.patch(`/report/${report.id}/resolve`, {}, {
                    preserveScroll: true,
                });
            };

            return (
                <div className="flex justify-center gap-1.5">
                    {!report.is_acknowledge && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-8 w-8 p-0 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/40"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcknowledge();
                                    }}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                <p>Acknowledge Report</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {report.status === 'Ongoing' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-8 w-8 p-0 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResolve();
                                    }}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                <p>Mark as Resolved</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <ViewReportDetails report={report}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Open className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                </Button>
                            </TooltipTrigger>
                        </ViewReportDetails>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <EditReport report={report} reportTypes={reportTypes}>
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
                        </EditReport>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                            <p>Edit Report</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <ArchiveReport report={report}>
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
                        </ArchiveReport>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                            <p>Archive Report</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
