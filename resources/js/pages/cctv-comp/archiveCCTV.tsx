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
import { useForm } from '@inertiajs/react';
import {
    Activity,
    Archive,
    Camera,
    MapPin,
    Monitor,
    Settings,
    Trash2,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { cctv_T } from '../../types/cctv-location-types';

interface ArchiveCCTVProps {
    cctv: cctv_T;
    onArchiveSuccess?: () => void;
}

function ArchiveCCTV({ cctv, onArchiveSuccess }: ArchiveCCTVProps) {
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

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'maintenance':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleArchive = () => {
        if (!isConfirmationValid) return;

        deleteRequest(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
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
                <div className="cursor-pointer rounded-full p-2 hover:bg-destructive/20">
                    <Archive className="text-destructive" size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="border-gray-700 bg-gray-900 text-white sm:max-w-[500px]">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-red-900/20 p-2">
                            <Trash2 className="h-5 w-5 text-red-400" />
                        </div>
                        <DialogTitle className="text-lg text-red-400">
                            Archive CCTV Device
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-300">
                        Are you sure you want to archive this CCTV device? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Device Information Card */}
                <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-900/20 p-2">
                            <Camera className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-white">
                                {cctv.device_name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                    {cctv.location?.barangay}
                                </span>
                            </div>
                        </div>
                        <Badge
                            className={`gap-1 capitalize ${getStatusColor(cctv.status)}`}
                        >
                            {getStatusIcon(cctv.status)}
                            {cctv.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-1 border-t border-gray-700 pt-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Location:</span>
                            <span className="text-gray-300">
                                {cctv.location?.location_name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Barangay:</span>
                            <span className="text-gray-300">
                                {cctv.location?.barangay}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Landmark:</span>
                            <span className="text-gray-300">
                                {cctv.location?.landmark}
                            </span>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-2">
                        <div className="text-sm">
                            <span className="block text-gray-400">
                                Resolution:
                            </span>
                            <span className="text-gray-300">
                                {cctv.resolution || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-gray-400">FPS:</span>
                            <span className="text-gray-300">
                                {cctv.fps || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-gray-400">Brand:</span>
                            <span className="text-gray-300">
                                {cctv.brand || 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-gray-400">Model:</span>
                            <span className="text-gray-300">
                                {cctv.model || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Camera Count (if available) */}
                    <div className="flex items-center gap-2 border-t border-gray-700 pt-2">
                        <Monitor className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-gray-400">
                            Active Streams:{' '}
                            <span className="text-blue-400">1</span>
                        </span>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                        To confirm archival, type{' '}
                        <span className="font-semibold text-red-400">
                            {cctv.device_name}
                        </span>{' '}
                        below:
                    </div>
                    <Input
                        placeholder="Enter device name to confirm"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-red-400"
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
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {processing ? 'Archiving...' : 'Archive Device'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ArchiveCCTV;
