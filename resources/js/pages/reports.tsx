import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { useAccidentRealtime } from '@/hooks/use-accident-realtime';
import AppLayout from '@/layouts/app-layout';
import { reports as reportRoutes } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { ReportsProps, reports_T } from '@/types/report-types';
import { Head, router } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReportsCard from './reports-comp/reports-card';
import ReportActionTab from './reports-comp/reports-tab';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Reports = ({ reports, reportTypes, currentView = 'incidents' }: ReportsProps) => {
    const [filteredReports, setFilteredReports] = useState<reports_T[]>(
        reports.data,
    );

    useEffect(() => {
        setFilteredReports(reports.data);
    }, [reports.data]);

    const handleViewChange = (value: string) => {
        router.get(
            reportRoutes().url,
            { view: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Real-time connection
    const { isConnected } = useAccidentRealtime();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Incident Monitoring',
            href: reportRoutes().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incident Monitoring" />
            <div className="mx-auto w-full space-y-2 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Incident Monitoring
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Real-time overview of detected accidents and citizen
                            reports.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 h-full">
                        {/* Only show FalseAlarmMonitor sheet when in incidents view to avoid redundancy */}
                        <Badge
                            variant={isConnected ? 'outline' : 'destructive'}
                            className={`gap-1.5 px-3 py-1.5 text-sm ${isConnected ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20' : ''}`}
                        >
                            {isConnected ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    <span className="font-medium">
                                        System Online
                                    </span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3.5 w-3.5" />
                                    <span>Reconnecting...</span>
                                </>
                            )}
                        </Badge>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-2">
                    <div className="flex flex-col gap-4">
                        <Tabs value={currentView} onValueChange={handleViewChange} className="w-full">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="incidents">Valid Incidents</TabsTrigger>
                                <TabsTrigger value="false_alarms">False Alarms</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <h2 className="text-lg font-semibold text-foreground">
                                {currentView === 'incidents' ? 'All Reports' : 'False Alarm Logs'}
                            </h2>
                            <ReportActionTab
                                reports={reports}
                                reportTypes={reportTypes}
                                setFilteredReports={setFilteredReports}
                            />
                        </div>
                    </div>

                    <ReportsCard
                        reports={filteredReports}
                        reportTypes={reportTypes}
                    />

                    {/* Pagination */}
                    {reports.links && (
                        <div className="flex justify-center pt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href={reports.prev_page_url || '#'}
                                            className={
                                                !reports.prev_page_url
                                                    ? 'pointer-events-none opacity-50'
                                                    : ''
                                            }
                                        />
                                    </PaginationItem>
                                    {reports.links.map(
                                        (
                                            link: {
                                                url: string | null;
                                                active: boolean;
                                                label: string;
                                            },
                                            index: number,
                                        ) => {
                                            if (
                                                link.url !== null &&
                                                index !== 0 &&
                                                index !==
                                                reports.links.length - 1
                                            ) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationLink
                                                            isActive={link.active}
                                                            href={link.url || '#'}
                                                        >
                                                            {link.label}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            }
                                            return null;
                                        },
                                    )}
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            href={reports.next_page_url || '#'}
                                            className={
                                                !reports.next_page_url
                                                    ? 'pointer-events-none opacity-50'
                                                    : ''
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Reports;
