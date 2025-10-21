import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Archive, ExternalLink as Open, SquarePen } from 'lucide-react';

import { reports_T } from '@/types/report-types';
import ArchiveReport from './reports-archive';
import EditReport from './reports-edit';
import ViewReportDetails from './reports-view';

type ReportsCardProps = {
    reports: reports_T[];
    reportTypes: string[];
};

const ReportsCard = ({ reports, reportTypes }: ReportsCardProps) => {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {reports.length === 0 && (
                <div className="flex min-h-[200px] items-center justify-center rounded-[var(--radius)] border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        No reports found at the moment
                    </p>
                </div>
            )}

            {/* Use filtered_roles for displaying cards */}
            {reports.map((report) => (
                <Card
                    key={report.id}
                    className="relative overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border"
                >
                    <CardHeader>
                        <CardTitle>
                            {' '}
                            <span>Report ID: #{report.id}</span>
                        </CardTitle>
                        <CardDescription>
                            {' '}
                            <Badge variant="default" className="text-sm">
                                {report.status}
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col">
                            <p className="text-md">Incident Description</p>
                            <p className="text-md text-muted-foreground">
                                {report.description}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex w-full justify-end gap-2">
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
                                    <p>Edit User</p>
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
                                    <p>Archive User</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default ReportsCard;
