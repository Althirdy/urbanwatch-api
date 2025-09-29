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
import { useForm } from '@inertiajs/react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils'
import { LocationCategory_T } from '../locations'
import { MapModal } from "@/components/map-modal"
import { toast } from "@/components/use-toast"

const barangay = [
    { id: 1, name: 'Brgy 176 - A' },
    { id: 2, name: 'Brgy 176 - B' },
    { id: 3, name: 'Brgy 176 - C' },
    { id: 4, name: 'Brgy 176 - D' },
    { id: 5, name: 'Brgy 176 - E' },
    { id: 6, name: 'Brgy 176 - F' },
]

type Barangay = {
    id: number;
    name: string;
}

type SelectionState = {
    value: Barangay | LocationCategory_T | null;
    open: boolean;
}

function CreateLocation({ locationCategory = [] }: { locationCategory?: LocationCategory_T[] }) {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false);

    // Inertia form handling
    const { data, setData, post, processing, errors, reset } = useForm({
        location_name: '',
        landmark: '',
        barangay: '',
        location_category: '',
        latitude: '',
        longitude: '',
        description: '',
    });


    // Combined states for both selectors
    const [barangayState, setBarangayState] = useState<SelectionState>({
        value: null,
        open: false
    });

    const [categoryState, setCategoryState] = useState<SelectionState>({
        value: null,
        open: false
    });

    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: ''
    });

    // Handlers for barangay selection
    const handleBarangaySelect = (selected: Barangay | null) => {
        setBarangayState({
            value: selected,
            open: false
        });
        setData('barangay', selected ? selected.name : '');
    };

    // Handlers for category selection
    const handleCategorySelect = (selected: LocationCategory_T | null) => {
        setCategoryState({
            value: selected,
            open: false
        });
        setData('location_category', selected ? selected.id.toString() : '');
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString()
        };
        setCoordinates(coords);
        setData('latitude', coords.latitude);
        setData('longitude', coords.longitude);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/locations', {
            onSuccess: () => {
                // Show success toast
                toast({
                    title: "Success!",
                    description: "Location created successfully.",
                    variant: "default",
                });
                
                // Reset form
                reset();
                setBarangayState({ value: null, open: false });
                setCategoryState({ value: null, open: false });
                setCoordinates({ latitude: '', longitude: '' });
                
                // Close the sheet
                setSheetOpen(false);
            },
            onError: (errors) => {
                // Show error toast
                toast({
                    title: "Error",
                    description: "Failed to create location. Please check your inputs and try again.",
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Location
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
                    <div className="grid flex-1 auto-rows-min gap-10 px-4 py-6">
                        <div className="grid gap-3">
                            <div className=''>
                                <Label htmlFor="location-name">Location Name</Label>
                                <Input
                                    id="location-name"
                                    placeholder="Ph-1 Palengke"
                                    value={data.location_name}
                                    onChange={(e) => setData('location_name', e.target.value)}
                                />
                                {errors.location_name && <p className="text-red-500 text-sm mt-1">{errors.location_name}</p>}
                            </div>
                            <div >
                                <Label htmlFor="location-landmark">Near Landmark</Label>
                                <Input
                                    id="location-landmark"
                                    placeholder="Enter nearby landmark"
                                    value={data.landmark}
                                    onChange={(e) => setData('landmark', e.target.value)}
                                />
                                {errors.landmark && <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>}
                            </div>

                            {/* Barangay Selector */}
                            <Popover
                                open={barangayState.open}
                                onOpenChange={(open: boolean) => setBarangayState(prev => ({ ...prev, open }))}
                            >
                                <PopoverTrigger asChild>
                                    <div>
                                        <Label className='mb-2'>Barangay</Label>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={barangayState.open}
                                            className="w-full justify-between"
                                        >
                                            {barangayState.value ? (barangayState.value as Barangay).name : "Select Barangay"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandList>
                                            <CommandEmpty>No barangay found.</CommandEmpty>
                                            <CommandGroup>
                                                {barangay.map((brgy) => (
                                                    <CommandItem
                                                        key={brgy.id}
                                                        value={brgy.name}
                                                        onSelect={() => handleBarangaySelect(
                                                            (barangayState.value as Barangay)?.id === brgy.id ? null : brgy
                                                        )}
                                                    >
                                                        {brgy.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto",
                                                                (barangayState.value as Barangay)?.id === brgy.id
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.barangay && <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>}

                            {/* Zone Category */}
                            <Popover
                                open={categoryState.open}
                                onOpenChange={(open: boolean) => setCategoryState(prev => ({ ...prev, open }))}
                            >
                                <PopoverTrigger asChild>
                                    <div>
                                        <Label className='mb-2'>Zone Category</Label>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={categoryState.open}
                                            className="w-full justify-between"
                                        >
                                            {categoryState.value ? categoryState.value.name : "Select Category"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className=" p-0">
                                    <Command>
                                        <CommandList>
                                            <CommandEmpty>No category found.</CommandEmpty>
                                            <CommandGroup>
                                                {(locationCategory || []).map((category) => (
                                                    <CommandItem
                                                        key={category.id}
                                                        value={category.name}
                                                        onSelect={() => handleCategorySelect(categoryState.value?.id === category.id ? null : category)}
                                                    >
                                                        {category.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto",
                                                                categoryState.value?.id === category.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.location_category && <p className="text-red-500 text-sm mt-1">{errors.location_category}</p>}

                            {/* GPS Coordinates */}
                            <div className="space-y-2">
                                <Label>GPS Coordinates</Label>
                                <MapModal
                                    onLocationSelect={handleLocationSelect}
                                    coordinates={coordinates}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            value={coordinates.latitude.slice(0, 8) + '...'}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            value={coordinates.longitude.slice(0, 8) + '...'}
                                            disabled
                                        />
                                    </div>
                                </div>
                                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    className='resize-none'
                                    placeholder="e.g High traffic during rush hour"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </div>

                        </div>
                    </div>
                    <SheetFooter className="px-4">
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Creating...' : 'Add Location'}
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

export default CreateLocation