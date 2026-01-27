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
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/use-toast';
import { useForm } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { format } from 'date-fns'; // Add this import
import { Camera, ChevronDownIcon, MoveLeft, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { location_T } from '../../types/cctv-location-types';

function AddCCTVDevice({ location }: { location: location_T[] }) {
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        device_name: '',
        primary_rtsp_url: '',
        backup_rtsp_url: '',
        location_id: '',
        status: '',
        model: '',
        brand: '',
        fps: '',
        resolution: '',
        bitrate: '',
        installation_date: '',
    });

    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(undefined);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data being sent:', data); // Debug log

        post('/devices/cctv', {
            onSuccess: () => {
                console.log('CCTV device created successfully');
                toast({
                    title: 'Success!',
                    description: 'CCTV device created successfully.',
                    variant: 'default',
                });
                reset();
                setDate(undefined);
                setDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                toast({
                    title: 'Error',
                    description:
                        'Failed to create CCTV device. Please check your inputs.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
               <Button className="cursor-pointer px-4 py-2">
                    <Plus /> Add CCTV
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6">
                        <DialogTitle>Add New CCTV Device</DialogTitle>
                        <DialogDescription>
                            Add a new CCTV camera device with its configuration
                            details.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
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

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="primary-rtsp-url">
                                    Primary RTSP URL
                                </Label>
                                <Input
                                    id="primary-rtsp-url"
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
                                    Backup RTSP URL
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
                                        onValueChange={(value) =>
                                            setData('location_id', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent id="cctv-location">
                                            <SelectGroup>
                                                {location.map((loc) => (
                                                    <SelectItem
                                                        key={loc.id}
                                                        value={loc.id.toString()}
                                                    >
                                                        {loc.location_name}
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
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent id="cctv-status">
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
                                    <Select
                                        onValueChange={(value) =>
                                            setData('fps', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent id="fps">
                                            <SelectGroup>
                                                <SelectItem value="24">
                                                    24 FPS
                                                </SelectItem>
                                                <SelectItem value="30">
                                                    30 FPS
                                                </SelectItem>
                                                <SelectItem value="60">
                                                    60 FPS
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
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
                                        onValueChange={(value) =>
                                            setData('resolution', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent id="cctv-resolution">
                                            <SelectGroup>
                                                <SelectItem value="4k">
                                                    4K
                                                </SelectItem>
                                                <SelectItem value="1080p">
                                                    1080p
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
                                                ? date.toLocaleDateString()
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
                                    <Camera className="inline h-4 w-4" />
                                )}
                                {processing ? 'Saving...' : 'Add CCTV'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddCCTVDevice;
