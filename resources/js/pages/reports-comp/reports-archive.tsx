import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { reports_T } from '@/types/report-types';
import { useForm } from '@inertiajs/react';

import { Archive, FileText } from 'lucide-react';

type ArchiveReportProps = {
    report: reports_T;
    children: React.ReactNode;
};

function ArchiveReport({ report, children }: ArchiveReportProps) {
    const { delete: destroy, processing } = useForm();

    const handleArchive = () => {
        destroy(`/report/${report.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive Report
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this report?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-fit w-fit rounded-md bg-muted p-2 text-muted-foreground">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <h3 className="text-lg font-bold truncate text-foreground">
                                    Report #{report.id}
                                </h3>
                                <div className="text-sm text-muted-foreground">
                                    {report.report_type}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 border-t border-border pt-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-destructive font-medium">
                        ⚠️ Archiving will remove this report from active lists. This action cannot be undone.
                    </p>
                </div>

                <AlertDialogFooter className="gap-2 pt-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleArchive}
                        disabled={processing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive Report'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ArchiveReport;
