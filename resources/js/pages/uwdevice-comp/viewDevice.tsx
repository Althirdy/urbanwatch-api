import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getDeviceStatusColorClass } from '@/lib/badgeStyles';
import { cctv_T, uwDevice_T } from '@/types/cctv-location-types';
import { Camera, Cpu, ExternalLink, MapPin, MoveLeft, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface ViewUWDeviceProps {
    device: uwDevice_T;
    children?: React.ReactNode;
}

function ViewUWDevice({
    device,
    children,
}: ViewUWDeviceProps): React.JSX.Element {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="cursor-pointer rounded-full p-2 hover:bg-secondary/20">
                        <ExternalLink size={20} />
                    </div>
                )}
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                {/* Fixed Header */}
                <DialogHeader className="flex-shrink-0 px-6 pt-6">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {device.device_name}
                    </DialogTitle>
                    <DialogDescription className="flex flex-row items-center gap-2">
                        <Badge
                            className={`capitalize ${getDeviceStatusColorClass(device.status)}`}
                        >
                            {device.status}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50">
                            SN: {device.device_id}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex w-full flex-1 flex-col justify-start gap-10 overflow-y-auto px-6">
                    <div className="grid auto-rows-min gap-6">

                        {/* Location Assignment Section */}
                        <div className="grid gap-3">
                            <Label className="text-muted-foreground">
                                Location Assignment
                            </Label>

                            {/* Predefined Location */}
                            {device.location && !device.custom_address && (
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {
                                                        device.location
                                                            .location_name
                                                    }
                                                </p>

                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {device.location?.landmark}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {device.location?.barangay}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Custom Location */}
                            {device.custom_address && (
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                                        <div className="space-y-1">

                                            <p className="text-sm text-muted-foreground">
                                                {device.custom_address}
                                            </p>
                                            <div className="mt-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Latitude
                                                    </p>
                                                    <p className="text-xs">
                                                        {Number(
                                                            device.custom_latitude,
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Longitude
                                                    </p>
                                                    <p className="text-xs">
                                                        {Number(
                                                            device.custom_longitude,
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No Location */}
                            {!device.location && !device.custom_address && (
                                <div className="rounded-lg border-2 border-dashed border-muted p-4 text-center">
                                    <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        No location assigned
                                    </p>
                                </div>
                            )}
                        </div>



                        {/* API Credentials */}
                        <div className="grid gap-3">
                            <Label className="text-muted-foreground">
                                API Token
                            </Label>
                            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-400 border border-zinc-800">
                                {device.api_token ? (
                                    <div className="flex items-center justify-between">
                                        <span className="truncate">
                                            {device.api_token.substring(0, 15)}***************************
                                        </span>
                                        <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 uppercase border-zinc-700 text-zinc-500">
                                            Masked
                                        </Badge>
                                    </div>
                                ) : (
                                    <span className="text-zinc-600 italic">No token found</span>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * Tokens are only shown in full ONCE during device registration.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <DialogFooter className="flex-shrink-0 px-6 pb-4">
                    <DialogClose asChild>
                        <Button variant="outline">
                            <MoveLeft className="h-6 w-6" />
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ViewUWDevice;
