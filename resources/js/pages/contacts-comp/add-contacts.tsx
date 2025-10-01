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
import { useForm, router } from '@inertiajs/react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils'
import { MapModal } from "@/components/map-modal"
import { toast } from "@/components/use-toast"

const responderTypes = [
    { id: 1, name: 'Police' },
    { id: 2, name: 'Fire' },
    { id: 3, name: 'Medical' },
    { id: 4, name: 'Barangay' },
    { id: 5, name: 'Traffic' },
]

const locations = [
    { id: 1, name: 'Monumento Circle' },
    { id: 2, name: 'Grace Park' },
    { id: 3, name: 'Bagong Barrio' },
    { id: 4, name: 'Maypajo' },
    { id: 5, name: 'Camarin' },
]

type ResponderType = {
    id: number;
    name: string;
}

type Location = {
    id: number;
    name: string;
}

type SelectionState = {
    value: ResponderType | Location | null;
    open: boolean;
}

function AddContacts() {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false);

    // Inertia form handling
    const { data, setData, post, processing, errors, reset } = useForm({
        branch_unit_name: '',
        contact_person: '',
        responder_type: '',
        location: '',
        primary_mobile: '',
        backup_mobile: '',
        latitude: '',
        longitude: '',
        active: true,
    });

    // Combined states for selectors
    const [responderTypeState, setResponderTypeState] = useState<SelectionState>({
        value: null,
        open: false
    });

    const [locationState, setLocationState] = useState<SelectionState>({
        value: null,
        open: false
    });

    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: ''
    });

    // Handlers for responder type selection
    const handleResponderTypeSelect = (selected: ResponderType | null) => {
        setResponderTypeState({
            value: selected,
            open: false
        });
        setData('responder_type', selected ? selected.name : '');
    };

    // Handlers for location selection
    const handleLocationSelect = (selected: Location | null) => {
        setLocationState({
            value: selected,
            open: false
        });
        setData('location', selected ? selected.name : '');
    };

    const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
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
        post('/contacts', {
            onSuccess: () => {
                reset();
                setSheetOpen(false);
                toast({
                    title: "Success",
                    description: "Contact created successfully!",
                });
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: "An error occurred while creating the contact.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Contacts
                </Button>
            </SheetTrigger>
            <SheetContent>
                <form onSubmit={onSubmit}>
                    <SheetHeader>
                        <SheetTitle>Add Contacts</SheetTitle>
                        <SheetDescription>
                            Responder details, barangay, phones and service radius
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-4 px-4 py-6">
                        <div className="space-y-4">
                            
                            {/* Branch/Unit Name */}
                            <div>
                                <Label htmlFor="branch_unit_name">Branch/Unit Name</Label>
                                <Input
                                    id="branch_unit_name"
                                    placeholder=""
                                    value={data.branch_unit_name}
                                    onChange={(e) => setData('branch_unit_name', e.target.value)}
                                />
                                {errors.branch_unit_name && <p className="text-red-500 text-sm mt-1">{errors.branch_unit_name}</p>}
                            </div>

                            {/* Contact Person (Optional) */}
                            <div>
                                <Label htmlFor="contact_person">Contact Person (Optional)</Label>
                                <Input
                                    id="contact_person"
                                    placeholder=""
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                />
                                {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
                            </div>

                            {/* Responder Type and Location - Side by Side */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Responder Type */}
                                <div>
                                    <Label>Responder Type</Label>
                                    <Popover open={responderTypeState.open} onOpenChange={(open) => setResponderTypeState({ ...responderTypeState, open })}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={responderTypeState.open}
                                                className="w-full justify-between"
                                            >
                                                {responderTypeState.value ? responderTypeState.value.name : "Select Type"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Search responder type..." />
                                                <CommandList>
                                                    <CommandEmpty>No responder type found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {responderTypes.map((type) => (
                                                            <CommandItem
                                                                key={type.id}
                                                                value={type.name}
                                                                onSelect={() => handleResponderTypeSelect(type)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        responderTypeState.value?.id === type.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {type.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.responder_type && <p className="text-red-500 text-sm mt-1">{errors.responder_type}</p>}
                                </div>

                                {/* Location - Typable */}
                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="Enter or select location"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                    />
                                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                                </div>
                            </div>

                            {/* Communication Data Section */}
                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">Communication Data</Label>
                            </div>

                            {/* Primary Mobile Number (Hotline) */}
                            <div>
                                <Label htmlFor="primary_mobile">Primary Mobile Number (Hotline)</Label>
                                <Input
                                    id="primary_mobile"
                                    placeholder=""
                                    value={data.primary_mobile}
                                    onChange={(e) => setData('primary_mobile', e.target.value)}
                                />
                                {errors.primary_mobile && <p className="text-red-500 text-sm mt-1">{errors.primary_mobile}</p>}
                            </div>

                            {/* Backup Mobile Number */}
                            <div>
                                <Label htmlFor="backup_mobile">Backup Mobile Number</Label>
                                <Input
                                    id="backup_mobile"
                                    placeholder=""
                                    value={data.backup_mobile}
                                    onChange={(e) => setData('backup_mobile', e.target.value)}
                                />
                                {errors.backup_mobile && <p className="text-red-500 text-sm mt-1">{errors.backup_mobile}</p>}
                            </div>

                            {/* GPS Coordinates */}
                            <div className="space-y-2">
                                <Label>Gps Coordinate</Label>
                                <MapModal
                                    onLocationSelect={handleMapLocationSelect}
                                    coordinates={coordinates}
                                />
                                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                            </div>

                            {/* Active Checkbox */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={data.active}
                                    onChange={(e) => setData('active', e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>

                        </div>
                    </div>
                    <SheetFooter className="px-4">
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Creating...' : 'Add Contact'}
                        </Button>
                        <SheetClose asChild>
                            <Button variant='outline' type="button">Cancel</Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default AddContacts;