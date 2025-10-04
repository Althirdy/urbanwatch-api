import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { reports as reportRoutes } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { List, Table } from 'lucide-react';
import { useState } from 'react';

import { reports_T, ReportsProps } from '@/types/report-types';
import ReportsCard from './reports-comp/reports-card';
import ReportsCarousel from './reports-comp/reports-carousel';
import ReportActionTab from './reports-comp/reports-tab';
import ReportsTable from './reports-comp/reports-table';

const Reports = ({
    reports,
    reportTypes,
    statusOptions,
    pendingReports,
}: ReportsProps) => {
    const [filteredReports, setFilteredReports] = useState<reports_T[]>(
        reports.data,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Reports Page',
            href: reportRoutes().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports Page" />
            <div className="space-y-4 p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-md font-semibold">
                            Pending Reports
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Unacknowledged pending incidents requiring immediate
                            attention.
                        </p>
                    </div>
                    <ReportsCarousel reports={pendingReports || []} />
                </div>

                <Tabs defaultValue="table" className="w-full space-y-2">
                    <div className="flex flex-row gap-4">
                        <ReportActionTab
                            reports={reports}
                            reportTypes={reportTypes}
                            statusOptions={statusOptions}
                            setFilteredReports={setFilteredReports}
                        />
                        <TabsList className="h-12 w-24">
                            <TabsTrigger
                                value="table"
                                className="cursor-pointer"
                            >
                                <List className="h-8 w-8" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="cursor-pointer"
                            >
                                <Table className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="table" className="w-full">
                        <ReportsTable
                            reports={filteredReports}
                            reportTypes={reportTypes}
                        />
                    </TabsContent>
                    <TabsContent value="card" className="w-full">
                        <ReportsCard
                            reports={filteredReports}
                            reportTypes={reportTypes}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default Reports;
