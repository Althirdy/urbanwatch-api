import { Button } from '@/components/ui/button';
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
    TableCaption,
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
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import ArchiveReport from './reports-archive';
import EditReport from './reports-edit';
import ViewReportDetails from './reports-view';

type ReportsTableProps = {
    reports: reports_T[];
    reportTypes: string[];
    links?: any[];
    currentPage?: number;
    lastPage?: number;
};

const ReportsTable = ({
    reports,
    reportTypes,
    links,
    currentPage = 1,
    lastPage = 1,
}: ReportsTableProps) => {
    return (
        <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--sidebar)]">
            <Table className=" border">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Report ID
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Report Type
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Report Content
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Location
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Date and Time
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
                    {reports.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No acknowledged reports found at the moment
                            </TableCell>
                        </TableRow>
                    ) : (
                        reports.map((report) => (
                            <TableRow
                                key={report.id}
                                className="text-center text-muted-foreground"
                            >
                                <TableCell className="py-3">
                                    #{report.id}
                                </TableCell>
                                <TableCell className="py-3">
                                    {report.report_type}
                                </TableCell>
                                <TableCell className="py-3 text-left">
                                    <div className="ellipsis flex flex-col truncate">
                                        <h1 className="font-semibold">
                                            {report.transcript}
                                        </h1>

                                        <span
                                            className="mt-1 block truncate text-muted-foreground"
                                            title={report.description}
                                        >
                                            {report.description.length > 100
                                                ? report.description.substring(
                                                      0,
                                                      100,
                                                  ) + '...'
                                                : report.description}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    {report.latitute}, {report.longtitude}
                                </TableCell>
                                <TableCell className="py-3">
                                    {formatDateTime(report.created_at)}
                                </TableCell>
                                <TableCell className="py-3">
                                    {report.status.toLocaleUpperCase()}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex justify-center gap-2">
                                        <Tooltip>
                                            <ViewReportDetails report={report}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer"
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
                                            <EditReport
                                                report={report}
                                                reportTypes={reportTypes}
                                            >
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer"
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
                                                        className="cursor-pointer"
                                                    >
                                                        <Archive className="h-4 w-4 text-[var(--destructive)]" />
                                                    </Button>
                                                </TooltipTrigger>
                                            </ArchiveReport>

                                            <TooltipContent>
                                                <p>Archive Report</p>
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

export default ReportsTable;
