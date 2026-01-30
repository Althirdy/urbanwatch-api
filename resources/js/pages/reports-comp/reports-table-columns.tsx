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

import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import ArchiveReport from './reports-archive';
import EditReport from './reports-edit';
import ViewReportDetails from './reports-view';

const reportTypeColors: Record<string, string> = {
    CCTV: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    'Citizen Concern': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    Emergency: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

const statusColors: Record<string, string> = {
    Ongoing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    Pending: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    Resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
};

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
            const colorClass =
                reportTypeColors[reportType] ||
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';

            return (
                <Badge
                    variant="outline"
                    className={`font-medium ${colorClass}`}
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
            const colorClass =
                statusColors[status] ||
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';

            return (
                <Badge
                    variant="outline"
                    className={`font-medium ${colorClass}`}
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
                <div className="flex justify-center gap-2">
                    {!report.is_acknowledge && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcknowledge();
                                    }}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
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
                                    className="cursor-pointer bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResolve();
                                    }}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
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
                                    className="cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Open className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                        </ViewReportDetails>
                        <TooltipContent>
                            <p>View Details</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <EditReport report={report} reportTypes={reportTypes}>
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
                        </EditReport>
                        <TooltipContent>
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
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2 border-red-500/20 bg-red-50/90 dark:bg-red-950/90 text-red-600 dark:text-red-400">
                            <p>Archive Report</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
