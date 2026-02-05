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
import { Activity, Archive, Camera, Cpu, Wifi } from 'lucide-react';
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
                        <div className="h-fit w-fit rounded-md bg-muted p-2 text-muted-foreground">
                            <Cpu className="h-6 w-auto" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                                {device.device_name}
                            </h3>
                        </div>
                        <Badge
                            variant="outline"
                            className={`gap-1 capitalize rounded-full py-0.5 ${getDeviceStatusColorClass(device.status)}`}
                        >
                            {getStatusIcon(device.status)}
                            {device.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-1 border-t border-border pt-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Location:
                            </span>
                            <span className="font-medium text-foreground">
                                {device.location?.location_name || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Barangay:
                            </span>
                            <span className="font-medium text-foreground">
                                {device.location?.barangay || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Landmark:
                            </span>
                            <span className="font-medium text-foreground">
                                {device.location?.landmark || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-2">
                        <div className="text-sm">
                            <span className="block text-xs text-muted-foreground">
                                Device ID:
                            </span>
                            <span className="text-foreground font-medium font-mono">
                                {device.device_id}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-xs text-muted-foreground">
                                AI Detection:
                            </span>
                            <span className="text-foreground font-medium">Active</span>
                        </div>
                    </div>

                    {/* Linked Cameras */}
                    {device.cctv_cameras && device.cctv_cameras.length > 0 && (
                        <div className="flex items-center gap-2 border-t border-border pt-2 text-sm">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Linked Cameras:{' '}
                            </span>
                            <span className="font-medium text-foreground">
                                {device.cctv_cameras.length}
                            </span>
                        </div>
                    )}
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
