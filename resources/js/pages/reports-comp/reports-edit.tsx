import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import { useForm } from '@inertiajs/react';
import {
    Globe,
    LocateFixed,
    MoveLeft,
    Save,
    TriangleAlert,
    User,
} from 'lucide-react';
import { FormEvent } from 'react';

type EditReportProps = {
    report: reports_T;
    reportTypes: string[];
    children: React.ReactNode;
};

type EditReportForm = {
    report_type: string;
    description: string;
    transcript: string;
    latitude: string;
    longtitude: string;
    status: string;
};

function EditReport({ report, reportTypes, children }: EditReportProps) {
    // Normalize status: convert "In Progress" to "Ongoing" for backend compatibility
    const normalizeStatus = (status: string | undefined): string => {
        if (!status) return 'Pending';
        if (status === 'In Progress') return 'Ongoing';
        return status;
    };

    // Store normalized status for both form data and UI logic
    const normalizedStatus = normalizeStatus(report.status);

    const { data, setData, put, processing, errors, reset } =
        useForm<EditReportForm>({
            report_type: report.report_type,
            description: report.description,
            transcript: report.transcript || '',
            latitude: report.latitude,
            longtitude: report.longtitude,
            status: normalizedStatus,
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        console.log('Updating report...');
        console.log('Form data:', data);

        put(`/report/${report.id}`, {
            onSuccess: () => {
                console.log('Report updated successfully');
                reset();
                // Force page reload to show updated data
                window.location.reload();
            },
            onError: (errors) => {
                console.log('Server validation errors:', errors);
            },
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <div className="flex flex-row items-center gap-4">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    Report #{report.id}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {report.report_type}
                                </p>
                                <div className="mt-1">
                                    {data.status === 'Pending' ? (
                                        <Badge
                                            variant="default"
                                            className="bg-yellow-500 text-sm"
                                        >
                                            PENDING
                                        </Badge>
                                    ) : data.status === 'Ongoing' ? (
                                        <Badge
                                            variant="default"
                                            className="bg-blue-500 text-sm"
                                        >
                                            ONGOING
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-500 text-sm text-white"
                                        >
                                            RESOLVED
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        {/* Report Information */}
                        <div className="flex w-full flex-col gap-6">
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid gap-3">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        Report Details
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="report-type">
                                        Report Type
                                    </Label>
                                    <div className="relative">
                                        <Select
                                            value={data.report_type}
                                            onValueChange={(value) =>
                                                setData('report_type', value)
                                            }
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors.report_type
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="Select report type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reportTypes.map((type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.report_type && (
                                            <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                {errors.report_type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="transcript">
                                        Report (Optional)
                                    </Label>
                                    <Textarea
                                        id="transcript"
                                        value={data.transcript}
                                        onChange={(e) =>
                                            setData(
                                                'transcript',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter call transcript or additional notes"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <div className="relative">
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter incident description"
                                            className={
                                                errors.description
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                {errors.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* GPS Coordinates (Locked) */}
                            <div className="flex flex-col gap-4">
                                <div className="grid">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        GPS Coordinates
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Coordinates are locked and cannot be changed
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label htmlFor="latitude">
                                                Latitude
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="latitude"
                                                    value={report.latitude}
                                                    disabled
                                                    className={
                                                        errors.latitude
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                />
                                                {errors.latitude && (
                                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                        {errors.latitude}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="longitude">
                                                Longitude
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="longitude"
                                                    value={report.longtitude}
                                                    disabled
                                                    className={
                                                        errors.longtitude
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                />
                                                {errors.longtitude && (
                                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                        {errors.longtitude}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        Status
                                    </p>
                                </div>
                                <div className="flex w-auto flex-row gap-4">
                                    <div className="grid flex-2 gap-4">
                                        <div className="relative">
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) =>
                                                    setData('status', value)
                                                }
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.status
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Only show Pending if current status is Pending */}
                                                    {data.status === 'Pending' && (
                                                        <SelectItem value="Pending">
                                                            Pending
                                                        </SelectItem>
                                                    )}
                                                    {/* Show Ongoing if current status is Pending or Ongoing */}
                                                    {(data.status === 'Pending' || data.status === 'Ongoing') && (
                                                        <SelectItem value="Ongoing">
                                                            Ongoing
                                                        </SelectItem>
                                                    )}
                                                    {/* Resolved is always available */}
                                                    <SelectItem value="Resolved">
                                                        Resolved
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                    {errors.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Report Metadata (Read-only) */}
                            <div className="flex flex-col gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        Report Information
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                    <div className="flex flex-row items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>
                                            Reported by:{' '}
                                            {report.report_type === 'CCTV' ? 'CCTV' : (report.user?.name || 'Unknown')}
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <LocateFixed className="h-4 w-4" />
                                        <span>
                                            Location: {report.latitude},{' '}
                                            {report.longtitude}
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <span>
                                            Created:{' '}
                                            {formatDateTime(report.created_at)}
                                        </span>
                                    </div>
                                    {report.acknowledgedBy && (
                                        <div className="flex flex-row items-center gap-2">
                                            <TriangleAlert className="h-4 w-4" />
                                            <span>
                                                Acknowledged by:{' '}
                                                {report.acknowledgedBy.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-dialog-close
                                    className="flex-1"
                                >
                                    <MoveLeft className="inline h-4 w-4" />
                                    Close
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-2"
                            >
                                {processing ? (
                                    <Spinner className="inline h-4 w-4" />
                                ) : (
                                    <Save className="inline h-4 w-4" />
                                )}
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditReport;
