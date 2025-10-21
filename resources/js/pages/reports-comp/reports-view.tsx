import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import { router } from '@inertiajs/react';
import {
    Check,
    Globe,
    LocateFixed,
    Mail,
    MoveLeft,
    Phone,
    TriangleAlert,
    User,
} from 'lucide-react';

type ViewReportDetailsProps = {
    report: reports_T;
    children: React.ReactNode;
};

type DetailItem = {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
};

function renderDetailItems(items: DetailItem[]) {
    return items.map(({ icon: Icon, text }, index) => (
        <div
            key={index}
            className="flex flex-row items-center gap-2 text-muted-foreground"
        >
            <Icon className="h-5 w-5" />
            <span>{text}</span>
        </div>
    ));
}

function ViewReportDetails({ report, children }: ViewReportDetailsProps) {
    const handleAcknowledge = () => {
        router.patch(
            `/report/${report.id}/acknowledge`,
            {},
            {
                preserveScroll: true,
            },
        );
    };
    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <SheetHeader>
                    <SheetTitle>Report Details</SheetTitle>
                    <SheetDescription className="flex flex-col gap-1">
                        <span>Report ID: #{report.id}</span>

                        <Badge variant="default" className="text-sm">
                            {report.status}
                        </Badge>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex w-full flex-col justify-start gap-4 px-4 py-2">
                    {/* Basic Information */}

                    <div className="flex flex-col gap-2">
                        <p className="text-md">Incident Snapshot</p>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-md">Incident Description</p>
                        <p className="text-md text-muted-foreground">
                            {report.description}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-md">Details</p>
                        {renderDetailItems([
                            {
                                icon: LocateFixed,
                                text: `${report.latitute}, ${report.longtitude}`,
                            },
                            {
                                icon: TriangleAlert,
                                text: report.report_type,
                            },

                            {
                                icon: Globe,
                                text: `Reported: ${formatDateTime(report.created_at)}`,
                            },
                        ])}
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-md">Report Information</p>
                        {renderDetailItems([
                            {
                                icon: User,
                                text: `${report.user?.name || 'Unknown'}`,
                            },
                            {
                                icon: Mail,
                                text: `${report.user?.email || 'No email provided'}`,
                            },
                            {
                                icon: Phone,
                                text: `${
                                    report.user?.official_details
                                        ?.contact_number
                                }`,
                            },
                        ])}
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <div className="flex w-full flex-col items-end justify-end gap-2">
                            {!report.is_acknowledge && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleAcknowledge}
                                    className="w-1/3 cursor-pointer py-6"
                                >
                                    <Check className="mr-2 inline h-4 w-4" />
                                    Acknowledge
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-1/4 cursor-pointer py-4"
                            >
                                <MoveLeft className="mr-2 inline h-4 w-4" />
                                Return
                            </Button>
                        </div>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
export default ViewReportDetails;
