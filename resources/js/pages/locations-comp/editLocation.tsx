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
import { Check, ChevronsUpDown, MapPin, SquarePen } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { LocationCategory_T, location_T } from '../locations'
import { MapModal } from "@/components/map-modal"
import { useForm } from '@inertiajs/react'
import { toast } from '@/components/use-toast'

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
    searchQuery: string;
    open: boolean;
}


function EditLocation({ location, locationCategory = [] }: { location: location_T, locationCategory?: LocationCategory_T[] }) {
    const [isOpen, setIsOpen] = useState(false);

    // Find initial barangay and category from the location data
    const initialBarangay = barangay.find(b => b.name === location.barangay) || null;
    const initialCategory = locationCategory.find(c => c.name === location.location_category?.name) || null;

    // Inertia form handling
    const { data, setData, put, processing, errors, reset } = useForm({
        location_name: location.location_name,
        landmark: location.landmark,
        barangay: location.barangay,
        location_category: initialCategory?.id.toString() || '',
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description || '',
    });

    // Combined states for both selectors
    const [barangayState, setBarangayState] = useState<SelectionState>({
        value: initialBarangay,
        searchQuery: '',
        open: false
    });

    const [categoryState, setCategoryState] = useState<SelectionState>({
        value: initialCategory,
        searchQuery: '',
        open: false
    });

    const [coordinates, setCoordinates] = useState({
        latitude: location.latitude,
        longitude: location.longitude
    });

    // Filtered lists based on search
    const filteredBarangay = barangayState.searchQuery.trim()
        ? barangay.filter(b =>
            b.name.toLowerCase().includes(barangayState.searchQuery.toLowerCase())
        )
        : barangay;

    const filteredCategories = categoryState.searchQuery.trim()
        ? (locationCategory || []).filter(c =>
            c.name.toLowerCase().includes(categoryState.searchQuery.toLowerCase())
        )
        : (locationCategory || []);

    // Handlers for barangay selection
    const handleBarangaySelect = (selected: Barangay | null) => {
        setBarangayState({
            value: selected,
            searchQuery: '',
            open: false
        });
        setData('barangay', selected ? selected.name : '');
    };

    // Handlers for category selection
    const handleCategorySelect = (selected: LocationCategory_T | null) => {
        setCategoryState({
            value: selected,
            searchQuery: '',
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
        put(`/locations/${location.id}`, {
            onSuccess: () => {
                setIsOpen(false);
                toast({
                    title: "Success!",
                    description: "Location updated successfully.",
                    variant: "default",
                });
                reset();
            },
            onError: () => {
                // Keep the sheet open to show errors
                toast({
                    title: "Error",
                    description: "Failed to update location. Please check your inputs and try again.",
                    variant: "destructive",
                });
                setIsOpen(true);
            },
            preserveScroll: true,
        });
    };

    const handleCancel = () => {
        // Reset form data to original values
        reset();
        setData({
            location_name: location.location_name,
            landmark: location.landmark,
            barangay: location.barangay,
            location_category: initialCategory?.id.toString() || '',
            latitude: location.latitude,
            longitude: location.longitude,
            description: location.description || '',
        });

        // Reset selectors to original values
        setBarangayState({
            value: initialBarangay,
            searchQuery: '',
            open: false
        });
        setCategoryState({
            value: initialCategory,
            searchQuery: '',
            open: false
        });
        setCoordinates({
            latitude: location.latitude,
            longitude: location.longitude
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className='p-2 rounded-full hover:bg-secondary/20 cursor-pointer' >
                    <SquarePen size={20} />
                </div>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Edit Location
                        </SheetTitle>
                        <SheetDescription>
                            Update the location details and coordinates.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                        <div className="grid gap-3">
                            <div>
                                <Label htmlFor="edit-location-name">Location Name</Label>
                                <div className="relative">
                                    <Input
                                        id="edit-location-name"
                                        placeholder="Ph-1 Palengke"
                                        value={data.location_name}
                                        onChange={(e) => setData('location_name', e.target.value)}
                                        className={errors.location_name ? 'border-red-500 focus:ring-red-500' : ''}
                                    />
                                    {errors.location_name && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.location_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-location-landmark">Near Landmark</Label>
                                <div className="relative">
                                    <Input
                                        id="edit-location-landmark"
                                        placeholder="Enter nearby landmark"
                                        value={data.landmark}
                                        onChange={(e) => setData('landmark', e.target.value)}
                                        className={errors.landmark ? 'border-red-500 focus:ring-red-500' : ''}
                                    />
                                    {errors.landmark && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.landmark}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Barangay Selector */}
                            <div className="relative">
                                <Popover
                                    open={barangayState.open}
                                    onOpenChange={(open: boolean) => setBarangayState(prev => ({ ...prev, open }))}
                                >
                                    <PopoverTrigger asChild>
                                        <div>
                                            <Label className='mb-2'>Barangay</Label>
                                            <Button
                                                type="button"
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
                                            <CommandInput
                                                value={barangayState.searchQuery}
                                                onValueChange={(search) =>
                                                    setBarangayState(prev => ({ ...prev, searchQuery: search }))
                                                }
                                                placeholder="Search barangay..."
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No barangay found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredBarangay.map((brgy) => (
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
                            </div>

                            {/* Zone Category */}
                            <div className="relative">
                                <Popover
                                    open={categoryState.open}
                                    onOpenChange={(open: boolean) => setCategoryState(prev => ({ ...prev, open }))}
                                >
                                    <PopoverTrigger asChild>
                                        <div>
                                            <Label className='mb-2'>Zone Category</Label>
                                            <Button
                                                type="button"
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
                                    <PopoverContent className="p-0">
                                        <Command>
                                            <CommandInput
                                                value={categoryState.searchQuery}
                                                onValueChange={(search) => {
                                                    setCategoryState(prev => ({ ...prev, searchQuery: search }));
                                                }}
                                                placeholder="Search location category..."
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No category found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredCategories.map((category) => (
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
                            </div>

                            {/* GPS Coordinates */}
                            <div className="space-y-2">
                                <Label>GPS Coordinates</Label>
                                <MapModal
                                    onLocationSelect={handleLocationSelect}
                                    coordinates={coordinates}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Label htmlFor="edit-latitude">Latitude</Label>
                                        <Input
                                            id="edit-latitude"
                                            value={coordinates.latitude}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Label htmlFor="edit-longitude">Longitude</Label>
                                        <Input
                                            id="edit-longitude"
                                            value={coordinates.longitude}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>
                                </div>
                                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <div className="relative">
                                    <Textarea
                                        id="edit-description"
                                        className={'resize-none ' + (errors.description ? 'border-red-500 focus:ring-red-500' : '')}
                                        placeholder="e.g High traffic during rush hour"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="px-4">
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <SheetClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default EditLocation