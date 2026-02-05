import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/use-toast';
import { getDeviceStatusColorClass } from '@/lib/badgeStyles';
import { router, useForm } from '@inertiajs/react';
import { Activity, Archive, Camera, Settings, Wifi, MapPin, Locate } from 'lucide-react';
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

    // Check if confirmation text matches location name
    const isConfirmationValid = confirmationText === cctv.location_name;

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

    const handleArchive = () => {
        if (!isConfirmationValid) return;

        deleteRequest(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                toast({
                    title: 'CCTV Device Archived',
                    description: `${cctv.location_name} has been successfully archived.`,
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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                        <Archive size={20} />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive CCTV Device
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this CCTV device? This
                        action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Device Information Card */}
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">

                            <div className="min-w-0 flex flex-col gap-2">
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                    {cctv.location_name}
                                </h3>
                                {cctv.package && (
                                    <div className="text-xs flex gap-1 text-muted-foreground">
                                        <MapPin className="inline h-4 w-auto shrink-0" />
                                        <p>{cctv.package}</p>
                                    </div>
                                )}
                                {cctv.latitude && cctv.longitude && (
                                    <div className="text-xs flex gap-1 text-muted-foreground">
                                        <Locate className="inline h-4 w-auto shrink-0" />
                                        <p className="font-mono">
                                            {Number(cctv.latitude).toFixed(4)},{' '}
                                            {Number(cctv.longitude).toFixed(4)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={`shrink-0 gap-1 text-xs font-medium px-1.5 py-0.5 capitalize ${getDeviceStatusColorClass(cctv.status)}`}
                        >
                            {cctv.status}
                        </Badge>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-3 py-2">
                    <Label
                        htmlFor="archive-cctv"
                        className="text-sm text-muted-foreground"
                    >
                        To confirm archival, type{' '}
                        <span className="font-bold text-destructive">
                            "{cctv.location_name}"
                        </span>{' '}
                        below:
                    </Label>
                    <div className="relative">
                        <Input
                            id="archive-cctv"
                            placeholder="Enter device name to confirm"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className={
                                confirmationText && !isConfirmationValid
                                    ? 'border-destructive'
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

export default ArchiveCCTV;
