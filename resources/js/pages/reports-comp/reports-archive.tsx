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
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Archive Report</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to archive{' '}
                        <strong>Report #{report.id}</strong> (
                        {report.report_type})?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
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
