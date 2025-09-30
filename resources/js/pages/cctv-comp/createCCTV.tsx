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
import { ChevronDownIcon, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { location_T } from '../devices'
import { Select } from '@radix-ui/react-select'
import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useForm } from '@inertiajs/react'


function AddCCTVDevice({ location }: { location: location_T[] }) {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        camera_name: '',
        primary_rtsp_url: '',
        backup_rtsp_url: '',
        location_id: '',
        status: '',
        model: '',
        brand: '',
        fps: '',
        resolution: '',
        date_installed: '',
    });

    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)



    const onSubmit = (e: React.FormEvent) => {

    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add CCTV
                </Button>
            </SheetTrigger>
            <SheetContent>
                <form onSubmit={onSubmit}>
                    <SheetHeader>
                        <SheetTitle>Create New Location</SheetTitle>
                        <SheetDescription>
                            Add a new location with its details and coordinates.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-4 px-4 py-6">
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="camera-name">Camera Name</Label>
                            <Input
                                id="camera-name"
                                placeholder=""
                            />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="primary-rtsp-url">Primary RTSP URL</Label>
                            <Input
                                id="primary-rtsp-url"
                                placeholder=""
                            />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="backup-rtsp-url">Backup RTSP URL</Label>
                            <Input
                                id="backup-rtsp-url"
                                placeholder=""
                            />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="cctv-location">CCTV Location</Label>
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a location" />
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
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="cctv-status">CCTV Status</Label>
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent id='cctv-status'>
                                    <SelectGroup>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <h3 className=' text-md'>CCTV Details</h3>
                            <p className='text-sm text-muted-foreground'>Additional settings for the CCTV camera.</p>
                        </div>
                        <div className='flex gap-2'>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    placeholder=""
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <div className='flex-1 flex-col gap-2'>
                                <Label htmlFor="fps">Fps</Label>
                                <Input
                                    id="model"
                                    placeholder=""
                                />
                            </div>
                            <div className='flex-1 flex-col gap-2'>
                                <Label htmlFor="cctv-resolution">Resolution</Label>
                                <Select>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Resolution" />
                                    </SelectTrigger>
                                    <SelectContent id='cctv-resolution'>
                                        <SelectGroup>
                                            <SelectItem value="4k">4k</SelectItem>
                                            <SelectItem value="1080p">1080p</SelectItem>
                                            <SelectItem value="720p">720p</SelectItem>
                                            <SelectItem value="480p">480p</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
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
                                            setDate(date)
                                            setOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                        </div>
                    </div>
                    <SheetFooter className="px-4">
                        <Button
                            type="submit"
                        >
                            Add CCTV
                        </Button>
                        <SheetClose asChild>
                            <Button variant='outline' type="button">Cancel</Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default AddCCTVDevice;