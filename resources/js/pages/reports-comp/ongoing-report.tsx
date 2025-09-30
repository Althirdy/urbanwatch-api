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
import { formatRelativeTime } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, Clock, LocateFixed, ExternalLink as Open } from 'lucide-react';

import { reports_T } from '@/types/report-types';
import ViewReportDetails from './view-report-details';

const OngoingReport = ({ report }: { report: reports_T }) => {
    const handleAcknowledge = () => {
        router.patch(
            `/report/${report.id}/acknowledge`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['reports'] });
                },
            },
        );
    };

    return (
        <Card className="flex h-full flex-col rounded-[var(--radius)]">
            <CardHeader>
                <CardTitle className="line-clamp-2 text-base">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-2">
                            <Badge variant="default" className="text-sm">
                                {report.report_type.toLocaleUpperCase()}
                            </Badge>
                            <Badge variant="default" className="text-sm">
                                {report.status.toLocaleUpperCase()}
                            </Badge>
                        </div>

                        <span className="text-md font-semibold">
                            {report.transcript}
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <div className="flex flex-col text-xs text-muted-foreground">
                    <span className="flex flex-row items-center gap-2 text-sm">
                        <LocateFixed className="mr-1 inline h-4 w-4" />
                        {report.latitute}, {report.longtitude}
                    </span>
                    <span className="flex flex-row items-center gap-2 text-sm">
                        <Clock className="mr-1 inline h-4 w-4" />
                        {formatRelativeTime(report.created_at)}
                    </span>
                </div>
                <CardDescription className="text-md line-clamp-3">
                    {report.description}
                </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-2">
                <ViewReportDetails report={report}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-1/4 cursor-pointer"
                    >
                        <Open className="mr-1 inline h-4 w-4" />
                        View Details
                    </Button>
                </ViewReportDetails>
                <Button
                    variant="default"
                    size="sm"
                    className="w-1/4 cursor-pointer"
                    onClick={handleAcknowledge}
                    disabled={report.is_acknowledge}
                >
                    <Check className="mr-1 inline h-4 w-4" />
                    {report.is_acknowledge ? 'Acknowledged' : 'Acknowledge'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default OngoingReport;
