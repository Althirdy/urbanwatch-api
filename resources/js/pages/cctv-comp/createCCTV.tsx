import React, { useState } from 'react'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { format } from 'date-fns'; // Add this import
import { ChevronDownIcon, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@radix-ui/react-select'
import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useForm } from '@inertiajs/react'
import { toast } from "@/components/use-toast"
import { location_T } from '../type'


function AddCCTVDevice({ location }: { location: location_T[] }) {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false);
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

    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data being sent:', data); // Debug log

        post('/devices/cctv', {
            onSuccess: () => {
                console.log('CCTV device created successfully');
                toast({
                    title: "Success!",
                    description: "CCTV device created successfully.",
                    variant: "default",
                });
                reset();
                setDate(undefined);
                setSheetOpen(false);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                toast({
                    title: "Error",
                    description: "Failed to create CCTV device. Please check your inputs.",
                    variant: "destructive",
                });
            },
        });
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add CCTV
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <SheetHeader className="flex-shrink-0 px-6 py-6 border-b">
                        <SheetTitle>Add New CCTV Device</SheetTitle>
                        <SheetDescription>
                            Add a new CCTV camera device with its configuration details.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="camera-name">Camera Name</Label>
                                <Input
                                    id="camera-name"
                                    value={data.device_name}
                                    onChange={(e) => setData('device_name', e.target.value)}
                                />
                                {errors.device_name && <p className="text-red-500 text-sm mt-1">{errors.device_name}</p>}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="primary-rtsp-url">Primary RTSP URL</Label>
                                <Input
                                    id="primary-rtsp-url"
                                    value={data.primary_rtsp_url}
                                    onChange={(e) => setData('primary_rtsp_url', e.target.value)}
                                />
                                {errors.primary_rtsp_url && <p className="text-red-500 text-sm mt-1">{errors.primary_rtsp_url}</p>}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="backup-rtsp-url">Backup RTSP URL</Label>
                                <Input
                                    id="backup-rtsp-url"
                                    value={data.backup_rtsp_url}
                                    onChange={(e) => setData('backup_rtsp_url', e.target.value)}
                                />
                                {errors.backup_rtsp_url && <p className="text-red-500 text-sm mt-1">{errors.backup_rtsp_url}</p>}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="cctv-location">CCTV Location</Label>
                                <Select onValueChange={(value) => setData('location_id', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent id='cctv-location'>
                                        <SelectGroup>
                                            {location.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    <div>
                                                        {loc.location_name} - {loc.category_name}
                                                        <div className='text-xs text-muted-foreground'>{loc.landmark}, {loc.barangay}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.location_id && <p className="text-red-500 text-sm mt-1">{errors.location_id}</p>}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="cctv-status">CCTV Status</Label>
                                <Select onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent id='cctv-status'>
                                        <SelectGroup>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                            </div>

                            <div className="pt-4">
                                <h3 className='text-md font-medium'>CCTV Details</h3>
                                <p className='text-sm text-muted-foreground'>Additional settings for the CCTV camera.</p>
                            </div>

                            <div className='flex gap-2'>
                                <div className='flex-1 flex flex-col gap-2'>
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={data.model}
                                        onChange={(e) => setData('model', e.target.value)}
                                    />
                                    {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                                </div>
                                <div className='flex-1 flex flex-col gap-2'>
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input
                                        id="brand"
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                    />
                                    {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                                </div>
                            </div>

                            <div className='flex gap-2'>
                                <div className='flex-1 flex flex-col gap-2'>
                                    <Label htmlFor="fps">FPS</Label>
                                    <Input
                                        id="fps"
                                        type="number"
                                        value={data.fps}
                                        onChange={(e) => setData('fps', e.target.value)}
                                    />
                                    {errors.fps && <p className="text-red-500 text-sm mt-1">{errors.fps}</p>}
                                </div>
                                <div className='flex-1 flex flex-col gap-2'>
                                    <Label htmlFor="cctv-resolution">Resolution</Label>
                                    <Select onValueChange={(value) => setData('resolution', value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent id='cctv-resolution'>
                                            <SelectGroup>
                                                <SelectItem value="4k">4K</SelectItem>
                                                <SelectItem value="1080p">1080p</SelectItem>
                                                <SelectItem value="720p">720p</SelectItem>
                                                <SelectItem value="480p">480p</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.resolution && <p className="text-red-500 text-sm mt-1">{errors.resolution}</p>}
                                </div>
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="date-installed">Date Installed</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="w-full justify-between font-normal"
                                        >
                                            {date ? date.toLocaleDateString() : "Select date"}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setData('installation_date', date ? format(date, 'yyyy-MM-dd') : '')
                                                setDate(date)
                                                setOpen(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.installation_date && <p className="text-red-500 text-sm mt-1">{errors.installation_date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <SheetFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
                        <div className="flex gap-2 w-full">
                            <SheetClose asChild>
                                <Button variant='outline' type="button" className="flex-1">
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1"
                            >
                                {processing ? 'Saving...' : 'Add CCTV'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default AddCCTVDevice;