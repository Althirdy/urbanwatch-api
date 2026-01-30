import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/use-toast';
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

    // Get status icon - matching CCTV pattern
    const getStatusIcon = (status: string) => {
        if (!status) return null;
        switch (status) {
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

    // Get status color - matching CCTV pattern
    const getStatusColor = (status: string) => {
        if (!status) return 'bg-gray-100 rounded-[var(--radius)] dark:bg-zinc-600';
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-700 rounded-[var(--radius)] dark:bg-green-800';
            case 'inactive':
                return 'bg-gray-100 rounded-[var(--radius)] dark:bg-zinc-600';
            case 'maintenance':
                return 'bg-orange-100 rounded-[var(--radius)] dark:bg-orange-700';
            default:
                return 'bg-gray-100 rounded-[var(--radius)] dark:bg-zinc-600';
        }
    };

    const handleArchive = async () => {
        if (!isConfirmationValid) return;

        setProcessing(true);

        // Use Inertia.js to make DELETE request to backend
        router.delete(`/devices/uwdevice/${device.id}`, {
            onSuccess: () => {
                toast({
                    title: 'IoT Device Archived',
                    description: `${device.device_name} has been successfully archived.`,
                    variant: 'default',
                });
                setOpen(false);
                setConfirmationText('');
                onArchiveSuccess?.();
                // Force page refresh to update the device list
                window.location.reload();
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="cursor-pointer rounded-[var(--radius)] p-2 hover:bg-destructive/20">
                        <Archive className="text-destructive" size={20} />
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
                        <Archive className="h-5 w-5" />
                        Archive IoT Box
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this IoT sensor box?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Device Information Card */}
                <div className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-fit w-fit rounded-[var(--radius)] bg-zinc-500 p-2">
                            <Cpu className="h-6 w-auto" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center">
                            <h3 className="text-lg font-semibold text-foreground">
                                {device.device_name}
                            </h3>
                        </div>
                        <Badge
                            className={`gap-1 capitalize ${getStatusColor(device.status)}`}
                        >
                            {getStatusIcon(device.status)}
                            {device.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-1 border-t border-[var(--border)] pt-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Location:
                            </span>
                            <span className="text-foreground">
                                {device.location?.location_name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Barangay:
                            </span>
                            <span className="text-foreground">
                                {device.location?.barangay}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Landmark:
                            </span>
                            <span className="text-foreground">
                                {device.location?.landmark}
                            </span>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-2">
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                Device Status:
                            </span>
                            <span className="text-foreground capitalize">
                                {device.status}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                AI Detection:
                            </span>
                            <span className="text-foreground">Active</span>
                        </div>
                    </div>

                    {/* Linked Cameras */}
                    {device.cctv_cameras && device.cctv_cameras.length > 0 && (
                        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 text-sm">
                            <Camera className="h-4 w-4 text-[var(--muted-foreground)]" />
                            <span className="text-[var(--muted-foreground)]">
                                Linked Cameras:{' '}
                            </span>
                            <span className="text-foreground">
                                {device.cctv_cameras.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2">
                    <div className="text-sm text-[var(--muted-foreground)]">
                        To confirm archival, type{' '}
                        <span className="font-bold text-[var(--destructive)] select-none">
                            "{device.device_name}"
                        </span>{' '}
                        below:
                    </div>
                    <Input
                        placeholder="Enter device name to confirm"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="text-foreground"
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleArchive}
                        disabled={!isConfirmationValid || processing}
                        variant="destructive"
                    >
                        {processing ? 'Archiving...' : 'Archive Device'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ArchiveUWDevice;
