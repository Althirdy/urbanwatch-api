import { MapModal } from '@/components/map-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import { useForm } from '@inertiajs/react';
import {
    Globe,
    LocateFixed,
    MoveLeft,
    TriangleAlert,
    User,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

type EditReportProps = {
    report: reports_T;
    reportTypes: string[];
    children: React.ReactNode;
};

type EditReportForm = {
    report_type: string;
    description: string;
    transcript: string;
    latitute: string;
    longtitude: string;
    is_acknowledge: boolean;
};

function EditReport({ report, reportTypes, children }: EditReportProps) {
    const { data, setData, put, processing, errors, reset } =
        useForm<EditReportForm>({
            report_type: report.report_type,
            description: report.description,
            transcript: report.transcript || '',
            latitute: report.latitute,
            longtitude: report.longtitude,
            is_acknowledge: report.is_acknowledge,
        });

    const [coordinates, setCoordinates] = useState({
        latitude: report.latitute,
        longitude: report.longtitude,
    });

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
        };
        setCoordinates(coords);
        setData('latitute', coords.latitude);
        setData('longtitude', coords.longitude);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        put(`/report/${report.id}`, {
            onSuccess: (page) => {
                reset();
                const closeButton = document.querySelector(
                    '[data-sheet-close]',
                ) as HTMLButtonElement;
                if (closeButton) closeButton.click();
            },
            preserveScroll: true,
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <div className="flex flex-row items-center gap-4">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    Report #{report.id}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {report.report_type}
                                </p>
                                <div className="mt-1">
                                    {!data.is_acknowledge ? (
                                        <Badge
                                            variant="default"
                                            className="text-sm"
                                        >
                                            PENDING
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            ACKNOWLEDGED
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex w-full flex-col justify-start gap-10 px-4 py-2">
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

                            {/* GPS Coordinates */}
                            <div className="flex flex-col gap-4">
                                <div className="grid">
                                    <p className="text-sm font-medium text-[var(--gray)]">
                                        GPS Coordinates
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <MapModal
                                        onLocationSelect={handleLocationSelect}
                                        coordinates={coordinates}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label htmlFor="latitude">
                                                Latitude
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="latitude"
                                                    value={coordinates.latitude}
                                                    disabled
                                                    className={
                                                        errors.latitute
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                />
                                                {errors.latitute && (
                                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                        {errors.latitute}
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
                                                    value={
                                                        coordinates.longitude
                                                    }
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
                                        Acknowledgment Status
                                    </p>
                                </div>
                                <div className="flex w-auto flex-row gap-4">
                                    <div className="grid flex-2 gap-4">
                                        <div className="relative">
                                            <Select
                                                value={
                                                    data.is_acknowledge
                                                        ? 'acknowledged'
                                                        : 'pending'
                                                }
                                                onValueChange={(value) =>
                                                    setData(
                                                        'is_acknowledge',
                                                        value ===
                                                            'acknowledged',
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.is_acknowledge
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">
                                                        Pending
                                                    </SelectItem>
                                                    <SelectItem value="acknowledged">
                                                        Acknowledged
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.is_acknowledge && (
                                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                    {errors.is_acknowledge}
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
                                            {report.user?.name || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <LocateFixed className="h-4 w-4" />
                                        <span>
                                            Location: {report.latitute},{' '}
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

                    <SheetFooter className="px-4">
                        <div className="flex w-full flex-row justify-end gap-2">
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-sheet-close
                                    className="cursor-pointer"
                                >
                                    <MoveLeft className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default EditReport;
