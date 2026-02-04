import { ImagePreview } from '@/components/image-preview';
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
import { formatRelativeTime } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    Archive,
    Camera,
    Check,
    Clock,
    ExternalLink as Open,
    LocateFixed,
    SquarePen,
    AlertTriangle,
} from 'lucide-react';

import { reports_T } from '@/types/report-types';
import ArchiveReport from './reports-archive';
import EditReport from './reports-edit';
import ViewReportDetails from './reports-view';

type ReportsCardProps = {
    reports: reports_T[];
    reportTypes: string[];
};

const ReportsCard = ({ reports, reportTypes }: ReportsCardProps) => {
    const handleAcknowledge = (id: number) => {
        console.log('Acknowledging report:', id);
        router.patch(
            `/report/${id}/acknowledge`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Successfully acknowledged');
                },
                onError: (errors) => {
                    console.error('Failed to acknowledge:', errors);
                    // You might want to show a toast here
                    alert('Failed to acknowledge report. Check console for details.');
                },
                onFinish: () => {
                    console.log('Request finished');
                }
            },
        );
    };

    const handleResolve = (id: number) => {
        console.log('Resolving report:', id);
        router.patch(
            `/report/${id}/resolve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Successfully resolved');
                },
                onError: (errors) => {
                    console.error('Failed to resolve:', errors);
                    alert('Failed to resolve report. Check console for details.');
                },
            },
        );
    };

    return (
        <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reports.length === 0 && (
                <Card className="col-span-full rounded-[var(--radius)] border border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            No reports found matching your selection.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Use filtered_roles for displaying cards */}
            {reports.map((report) => {
                // Get first image from media
                const firstImage =
                    report.media && report.media.length > 0
                        ? report.media[0]
                        : null;

                return (
                    <Card
                        key={report.id}
                        className="relative flex flex-col overflow-hidden rounded-[var(--radius)] border border-sidebar-border/70 shadow-sm transition-shadow hover:shadow-md dark:border-sidebar-border"
                    >
                        {/* Accident Image - Reduced height */}
                        {firstImage ? (
                            <ImagePreview
                                src={firstImage}
                                alt="Accident detection"
                            >
                                <div className="group relative h-36 w-full overflow-hidden bg-muted">
                                    <img
                                        src={firstImage}
                                        alt="Accident detection"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                        <Badge
                                            variant="destructive"
                                            className="px-1.5 py-0 text-xs font-semibold shadow-sm"
                                        >
                                            <Camera className="mr-1 h-2.5 w-2.5" />
                                            AI DETECTED
                                        </Badge>

                                        {report.media && report.media.length > 1 && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-black/50 px-1.5 py-0 text-xs text-white backdrop-blur-sm hover:bg-black/70"
                                            >
                                                +{report.media.length - 1} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </ImagePreview>
                        ) : (
                            <div className="relative flex h-36 w-full items-center justify-center bg-muted">
                                {report.status === 'False Alarm' ? (
                                    <div className="flex flex-col items-center gap-2 text-amber-500/50">
                                        <AlertTriangle className="h-10 w-10" />
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">Image Discarded</span>
                                    </div>
                                ) : (
                                    <Camera className="h-10 w-10 text-muted-foreground/20" />
                                )}
                            </div>
                        )}
                        <CardHeader className="px-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <CardTitle className="line-clamp-1 text-base font-extrabold leading-tight tracking-tight text-foreground">
                                        {report.transcript || `${report.report_type} Incident`}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">

                                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 text-muted-foreground">

                                            #{report.id}

                                        </Badge>

                                        {report.status === 'False Alarm' ? (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-medium px-1.5 py-0.5 capitalize border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                                            >
                                                False Alarm
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant={report.status === 'Resolved' ? 'default' : 'secondary'}
                                                className="text-[10px] font-medium px-1.5 py-0.5 capitalize"
                                            >
                                                {report.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 px-3">
                            <div className="flex flex-col gap-2">
                                <p className="line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground/90">
                                    {report.description}
                                </p>
                                <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <LocateFixed className="h-3.5 w-3.5 shrink-0 " />
                                        <span className="truncate ">
                                            {report.location_name || `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            {formatRelativeTime(report.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 p-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
                            {report.status !== 'False Alarm' && (
                                <div className="w-full">
                                    {!report.is_acknowledge ? (
                                        <Button
                                            size="sm"
                                            className="h-8 w-full text-xs font-bold shadow-sm"
                                            onClick={() => handleAcknowledge(report.id)}
                                        >
                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                            Acknowledge
                                        </Button>
                                    ) : report.status === 'Ongoing' ? (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                            onClick={() => handleResolve(report.id)}
                                        >
                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                            Mark as Resolved
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled
                                            className="h-8 w-full cursor-not-allowed text-xs opacity-70 border-zinc-200 dark:border-zinc-800"
                                        >
                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                            {report.status === 'Resolved' ? 'Resolved' : report.status}
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex w-full items-center justify-between gap-1.5">
                                <ViewReportDetails report={report}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 flex-1 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <Open className="mr-1.5 h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                                        Details
                                    </Button>
                                </ViewReportDetails>

                                {report.status !== 'False Alarm' && (
                                    <div className="flex gap-1.5">
                                        <Tooltip>
                                            <EditReport
                                                report={report}
                                                reportTypes={reportTypes}
                                            >
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                                                        size="icon"
                                                        className="h-8 w-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
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
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
};


export default ReportsCard;
