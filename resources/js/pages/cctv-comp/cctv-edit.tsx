import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/use-toast';
import { router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronDownIcon, MoveLeft, Save, SquarePen } from 'lucide-react';
import React, { useState } from 'react';
import { cctv_T, location_T } from '../../types/cctv-location-types';

interface EditCCTVDevice {
    location: location_T[];
    cctv: cctv_T;
    children?: React.ReactNode;
}

function EditCCTVDevice({ location, cctv, children }: EditCCTVDevice) {
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        device_name: cctv?.device_name || '',
        primary_rtsp_url: cctv?.primary_rtsp_url || '',
        backup_rtsp_url: cctv?.backup_rtsp_url || '',
        rtsp_username: cctv?.rtsp_username || '',
        rtsp_password: '', // Password is not returned by API for security, user can update it if needed
        location_id: cctv?.location?.id?.toString() || '',
        status: cctv?.status || '',
        model: cctv?.model || '',
        brand: cctv?.brand || '',
        fps: cctv?.fps?.toString() || '',
        resolution: cctv?.resolution || '',
        installation_date: cctv?.installation_date || '',
    });

    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(() => {
        if (cctv.installation_date) {
            const originalDate = new Date(cctv.installation_date);
            return originalDate;
        }
        return undefined;
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data being sent:', data);

        put(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                console.log('CCTV device updated successfully');
                toast({
                    title: 'Success!',
                    description: 'CCTV device updated successfully.',
                    variant: 'default',
                });
                setDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                toast({
                    title: 'Error',
                    description:
                        'Failed to update CCTV device. Please check your inputs.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="cursor-pointer rounded-full p-2 hover:bg-primary/20">
                        <SquarePen size={20} />
                    </div>
                )}
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    {/* Fixed Header */}
                    <DialogHeader className="flex-shrink-0 px-6 pt-6">
                        <DialogTitle>Edit CCTV Device</DialogTitle>
                        <DialogDescription>
                            Update the CCTV camera device configuration details.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="camera-name">Camera Name</Label>
                                <Input
                                    id="camera-name"
                                    value={data.device_name}
                                    onChange={(e) =>
                                        setData('device_name', e.target.value)
                                    }
                                />
                                {errors.device_name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.device_name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="rtsp-username">RTSP Username</Label>
                                    <Input
                                        id="rtsp-username"
                                        placeholder="admin"
                                        value={data.rtsp_username}
                                        onChange={(e) =>
                                            setData('rtsp_username', e.target.value)
                                        }
                                    />
                                    {errors.rtsp_username && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.rtsp_username}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="rtsp-password">RTSP Password</Label>
                                    <Input
                                        id="rtsp-password"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={data.rtsp_password}
                                        onChange={(e) =>
                                            setData('rtsp_password', e.target.value)
                                        }
                                    />
                                    {errors.rtsp_password && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.rtsp_password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="primary-rtsp-url">
                                    Primary Base RTSP URL
                                </Label>
                                <Input
                                    id="primary-rtsp-url"
                                    placeholder="192.168.1.100:554/stream1"
                                    value={data.primary_rtsp_url}
                                    onChange={(e) =>
                                        setData(
                                            'primary_rtsp_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.primary_rtsp_url && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.primary_rtsp_url}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="backup-rtsp-url">
                                    Backup Base RTSP URL (Optional)
                                </Label>
                                <Input
                                    id="backup-rtsp-url"
                                    value={data.backup_rtsp_url}
                                    onChange={(e) =>
                                        setData(
                                            'backup_rtsp_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.backup_rtsp_url && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.backup_rtsp_url}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-row justify-between gap-2">
                                <div className="flex w-full flex-col gap-2">
                                    <Label htmlFor="cctv-location">
                                        CCTV Location
                                    </Label>
                                    <Select
                                        value={data.location_id}
                                        onValueChange={(value) =>
                                            setData('location_id', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {location.map((loc) => (
                                                    <SelectItem
                                                        key={loc.id}
                                                        value={loc.id.toString()}
                                                    >
                                                        <div className="font-medium">
                                                            {loc.location_name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.location_id && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.location_id}
                                        </p>
                                    )}
                                </div>

                                <div className="flex w-full flex-col gap-2">
                                    <Label htmlFor="cctv-status">
                                        CCTV Status
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="active">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="inactive">
                                                    Inactive
                                                </SelectItem>
                                                <SelectItem value="maintenance">
                                                    Maintenance
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.status}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="text-md font-medium">
                                    CCTV Details
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Additional settings for the CCTV camera.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex flex-1 flex-col gap-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={data.model}
                                        onChange={(e) =>
                                            setData('model', e.target.value)
                                        }
                                    />
                                    {errors.model && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.model}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input
                                        id="brand"
                                        value={data.brand}
                                        onChange={(e) =>
                                            setData('brand', e.target.value)
                                        }
                                    />
                                    {errors.brand && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.brand}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex flex-1 flex-col gap-2">
                                    <Label htmlFor="fps">FPS</Label>
                                    <Input
                                        id="fps"
                                        type="number"
                                        value={data.fps}
                                        onChange={(e) =>
                                            setData('fps', e.target.value)
                                        }
                                    />
                                    {errors.fps && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.fps}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
                                    <Label htmlFor="cctv-resolution">
                                        Resolution
                                    </Label>
                                    <Select
                                        value={data.resolution}
                                        onValueChange={(value) =>
                                            setData('resolution', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select resolution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="4k">
                                                    4K
                                                </SelectItem>
                                                <SelectItem value="1080p">
                                                    1080p
                                                </SelectItem>
                                                <SelectItem value="720p">
                                                    720p
                                                </SelectItem>
                                                <SelectItem value="480p">
                                                    480p
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.resolution && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.resolution}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="date-installed">
                                    Date Installed
                                </Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="w-full justify-between font-normal"
                                        >
                                            {date
                                                ? format(date, 'PPP')
                                                : 'Select date'}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setData(
                                                    'installation_date',
                                                    date
                                                        ? format(
                                                            date,
                                                            'yyyy-MM-dd',
                                                        )
                                                        : '',
                                                );
                                                setDate(date);
                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.installation_date && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.installation_date}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    type="button"
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
                                {processing ? 'Updating...' : 'Update CCTV'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditCCTVDevice;
