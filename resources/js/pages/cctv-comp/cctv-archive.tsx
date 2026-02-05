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
import { router, useForm } from '@inertiajs/react';
import { Activity, Archive, Camera, Settings, Wifi } from 'lucide-react';
import { useState } from 'react';
import { cctv_T } from '../../types/cctv-location-types';

interface ArchiveCCTVProps {
    cctv: cctv_T;
    onArchiveSuccess?: () => void;
    children?: React.ReactNode;
}

function ArchiveCCTV({ cctv, onArchiveSuccess, children }: ArchiveCCTVProps) {
    const [open, setOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    const { delete: deleteRequest, processing } = useForm();

    // Check if confirmation text matches device name
    const isConfirmationValid = confirmationText === cctv.device_name;

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Activity className="h-3 w-3" />;
            case 'inactive':
                return <Wifi className="h-3 w-3" />;
            case 'maintenance':
                return <Settings className="h-3 w-3" />;
            default:
                return null;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLocaleUpperCase()) {
            case 'ACTIVE':
                return 'bg-green-700 rounded-[var(--radius)]  dark:bg-green-800 dark:';
            case 'MAINTENANCE':
                return 'bg-orange-100 rounded-[var(--radius)] dark:bg-orange-700 ';
            case 'INACTIVE':
                return 'bg-gray-100 rounded-[var(--radius)]  dark:bg-zinc-600 ';
            default:
                return 'bg-gray-100 rounded-[var(--radius)]  dark:bg-zinc-600 ';
        }
    };

    const handleArchive = () => {
        if (!isConfirmationValid) return;

        deleteRequest(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                toast({
                    title: 'CCTV Device Archived',
                    description: `${cctv.device_name} has been successfully archived.`,
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
                        'Failed to archive CCTV device. Please try again.',
                    variant: 'destructive',
                });
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
                {children || <Archive className="text-destructive" size={20} />}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
                        <Archive className="h-5 w-5" />
                        Archive CCTV Device
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this CCTV device? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Device Information Card */}
                <div className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-fit w-fit rounded-[var(--radius)] bg-zinc-500 p-2">
                            <Camera className="h-6 w-auto" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center">
                            <h3 className="text-lg font-semibold text-foreground">
                                {cctv.device_name}
                            </h3>
                        </div>
                        <Badge
                            className={`gap-1 capitalize ${getStatusStyles(cctv.status)}`}
                        >
                            {getStatusIcon(cctv.status)}
                            {cctv.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-1 border-t border-[var(--border)] pt-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Location:
                            </span>
                            <span className="text-whte">
                                {cctv.location?.location_name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Barangay:
                            </span>
                            <span className="text-foreground">
                                {cctv.location?.barangay}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">
                                Landmark:
                            </span>
                            <span className="text-foreground">
                                {cctv.location?.landmark}
                            </span>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-2">
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                Resolution:
                            </span>
                            <span className="text-foreground">
                                {cctv.resolution || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                FPS:
                            </span>
                            <span className="text-foreground">
                                {cctv.fps || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                Brand:
                            </span>
                            <span className="text-foreground">
                                {cctv.brand || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[var(--muted-foreground)]">
                                Model:
                            </span>
                            <span className="text-foreground">
                                {cctv.model || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2">
                    <div className="text-sm text-[var(--muted-foreground)]">
                        To confirm archival, type{' '}
                        <span className="font-bold text-[var(--destructive)] select-none">
                            "{cctv.device_name}"
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
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleArchive}
                        disabled={!isConfirmationValid || processing}
                        className="bg-red-600 text-foreground hover:bg-red-700"
                    >
                        {processing ? 'Archiving...' : 'Archive Device'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ArchiveCCTV;
