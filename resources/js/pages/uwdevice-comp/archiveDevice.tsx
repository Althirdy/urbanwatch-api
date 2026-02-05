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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/use-toast';
import { getDeviceStatusColorClass } from '@/lib/badgeStyles';
import { router } from '@inertiajs/react';
import { Activity, Archive, Camera, Cpu, Wifi, MapPin, Locate } from 'lucide-react';
import React, { useState } from 'react';
import { uwDevice_T } from '../../types/cctv-location-types';

interface ArchiveUWDeviceProps {
    device: uwDevice_T;
    onArchiveSuccess?: () => void;
    children?: React.ReactNode;
}

function ArchiveUWDevice({
    device,
    onArchiveSuccess,
    children,
}: ArchiveUWDeviceProps): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [processing, setProcessing] = useState(false);

    // Check if confirmation text matches device name
    const isConfirmationValid = confirmationText === device.device_name;

    // Get status icon
    const getStatusIcon = (status: string) => {
        if (!status) return null;
        switch (status.toLowerCase()) {
            case 'active':
                return <Activity className="h-3 w-3" />;
            case 'inactive':
                return <Wifi className="h-3 w-3" />;
            case 'maintenance':
                return <Archive className="h-3 w-3" />;
            default:
                return null;
        }
    };

    const handleArchive = async () => {
        if (!isConfirmationValid) return;

        setProcessing(true);

        router.delete(`/devices/uwdevice/${device.id}`, {
            onSuccess: () => {
                router.flushAll();
                toast({
                    title: 'IoT Device Archived',
                    description: `${device.device_name} has been successfully archived.`,
                    variant: 'default',
                });
                setOpen(false);
                setConfirmationText('');
                onArchiveSuccess?.();
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description:
                        'Failed to archive IoT device. Please try again.',
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const handleClose = () => {
        setOpen(false);
        setConfirmationText('');
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {children || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                        <Archive size={20} />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive IoT Box
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this IoT sensor box?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Device Information Card */}
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">

                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                                {device.device_name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="truncate">
                                    Device ID: {device.device_id}
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={`gap-1 shrink-0 capitalize text-xs font-medium px-1.5 py-0.5 ${getDeviceStatusColorClass(device.status)}`}
                        >
                            {device.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-2 text-xs">
                        {device.custom_address ? (
                            <div className="space-y-2">
                                <div className="flex gap-1 text-muted-foreground">
                                    <MapPin className="inline h-4 w-auto shrink-0" />
                                    <p>{device.custom_address}</p>
                                </div>
                                {device.custom_latitude && device.custom_longitude && (
                                    <div className="flex gap-1 text-muted-foreground">
                                        <Locate className="inline h-4 w-auto shrink-0" />
                                        <p className="font-mono">
                                            {Number(device.custom_latitude).toFixed(4)},{' '}
                                            {Number(device.custom_longitude).toFixed(4)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">
                                No location assigned
                            </p>
                        )}
                    </div>

                    {/* Anomaly Count */}
                    <div className="flex items-center justify-between rounded-[var(--radius)] bg-zinc-50 px-4 py-2 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground capitalize">Anomalies Detected</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            {device.anomaly_count || 0}
                        </span>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-3 py-2">
                    <Label
                        htmlFor="archive-iot"
                        className="text-sm text-muted-foreground"
                    >
                        To confirm archival, type{' '}
                        <span className="font-bold text-destructive">
                            "{device.device_name}"
                        </span>{' '}
                        below:
                    </Label>
                    <div className="relative">
                        <Input
                            id="archive-iot"
                            placeholder="Enter device name to confirm"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className={
                                confirmationText && !isConfirmationValid
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : ''
                            }
                        />
                        {confirmationText && !isConfirmationValid && (
                            <span className="absolute -bottom-5 left-0 text-[10px] text-destructive">
                                Name must match exactly
                            </span>
                        )}
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 pt-2">
                    <AlertDialogCancel
                        onClick={handleClose}
                        className="cursor-pointer"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleArchive}
                        disabled={!isConfirmationValid || processing}
                        className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive Device'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ArchiveUWDevice;
