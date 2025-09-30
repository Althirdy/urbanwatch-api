import AppLayout from '@/layouts/app-layout';
import { reports as reportRoutes } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import { reports_T, ReportsProps } from '@/types/report-types';
import OngoingReport from './reports-comp/ongoing-report';
import ReportActionTab from './reports-comp/report-tab';
import ReportsTable from './reports-comp/reports-table';

const Reports = ({ reports, reportTypes, statusOptions }: ReportsProps) => {
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
                            Ongoing Reports
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Active ongoing incidents requiring immediate
                            attention.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.data
                            .filter((report) => !report.is_acknowledge)
                            .map((report) => (
                                <OngoingReport
                                    key={report.id}
                                    report={report}
                                />
                            ))}
                    </div>
                </div>
                <ReportActionTab
                    reports={reports}
                    reportTypes={reportTypes}
                    statusOptions={statusOptions}
                    setFilteredReports={setFilteredReports}
                />
                <ReportsTable
                    reports={filteredReports}
                    reportTypes={reportTypes}
                />
            </div>
        </AppLayout>
    );
};

export default Reports;
