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
import { Switch } from "@/components/ui/switch"

const responderTypes = [
    { id: 1, name: 'BEST' },
    { id: 2, name: 'BCCM' },
    { id: 3, name: 'BCPC' },
    { id: 4, name: 'BDRRM' },
    { id: 5, name: 'BHERT' },
    { id: 6, name: 'BHW' },
    { id: 7, name: 'BPSO' },
    { id: 8, name: 'BTMO' },
    { id: 9, name: 'VAWC' },
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
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    // Mobile number validation function
    const validateMobileNumber = (value: string): string => {
        // Remove any non-digit characters
        const cleanValue = value.replace(/\D/g, '');
        
        // Limit to 11 digits
        return cleanValue.slice(0, 11);
    };

    // Check if mobile number is valid (exactly 11 digits)
    const isMobileNumberValid = (value: string): boolean => {
        return /^\d{11}$/.test(value);
    };

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
        setHasAttemptedSubmit(true);
        
        // Validate required fields
        if (!data.branch_unit_name.trim()) {
            toast({
                title: "Validation Error",
                description: "Branch/Unit Name is required.",
                variant: "destructive",
            });
            return;
        }
        
        if (!data.responder_type) {
            toast({
                title: "Validation Error",
                description: "Responder Type is required.",
                variant: "destructive",
            });
            return;
        }
        
        if (!data.location.trim()) {
            toast({
                title: "Validation Error",
                description: "Address is required.",
                variant: "destructive",
            });
            return;
        }
        
        if (!data.primary_mobile) {
            toast({
                title: "Validation Error",
                description: "Primary Mobile Number is required.",
                variant: "destructive",
            });
            return;
        }
        
        // Validate mobile numbers format
        if (!isMobileNumberValid(data.primary_mobile)) {
            toast({
                title: "Validation Error",
                description: "Primary mobile number must be exactly 11 digits.",
                variant: "destructive",
            });
            return;
        }
        
        if (data.backup_mobile && !isMobileNumberValid(data.backup_mobile)) {
            toast({
                title: "Validation Error",
                description: "Backup mobile number must be exactly 11 digits.",
                variant: "destructive",
            });
            return;
        }
        
        if (!data.latitude || !data.longitude) {
            toast({
                title: "Validation Error",
                description: "GPS Coordinate is required.",
                variant: "destructive",
            });
            return;
        }
        
        post('/contacts', {
            onSuccess: () => {
                reset();
                setSheetOpen(false);
                setHasAttemptedSubmit(false);
                // Reset all state when successful
                setResponderTypeState({ value: null, open: false });
                setLocationState({ value: null, open: false });
                setCoordinates({ latitude: '', longitude: '' });
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
        <Sheet open={sheetOpen} onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) {
                // Reset all states when closing
                setHasAttemptedSubmit(false);
                setResponderTypeState({ value: null, open: false });
                setLocationState({ value: null, open: false });
                setCoordinates({ latitude: '', longitude: '' });
                reset();
            }
        }}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Contacts
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <div className="flex-shrink-0">
                        <SheetHeader>
                            <SheetTitle>Add Contacts</SheetTitle>
                            <SheetDescription>
                                Responder details, barangay, phones and service radius
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="space-y-4">
                            
                            {/* Branch/Unit Name */}
                            <div>
                                <Label htmlFor="branch_unit_name">Branch/Unit Name</Label>
                                <Input
                                    id="branch_unit_name"
                                    placeholder=""
                                    value={data.branch_unit_name}
                                    onChange={(e) => setData('branch_unit_name', e.target.value)}
                                    className={hasAttemptedSubmit && !data.branch_unit_name.trim() ? 'border-red-500' : ''}
                                />
                                {hasAttemptedSubmit && !data.branch_unit_name.trim() && (
                                    <p className="text-red-500 text-sm mt-1">Branch/Unit Name is required</p>
                                )}
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

                            {/* Responder Type and Address - Side by Side */}
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
                                                className={`w-full justify-between ${hasAttemptedSubmit && !data.responder_type ? 'border-red-500' : ''}`}
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
                                    {hasAttemptedSubmit && !data.responder_type && (
                                        <p className="text-red-500 text-sm mt-1">Responder Type is required</p>
                                    )}
                                    {errors.responder_type && <p className="text-red-500 text-sm mt-1">{errors.responder_type}</p>}
                                </div>

                                {/* Address - Typable */}
                                <div>
                                    <Label htmlFor="location">Address</Label>
                                    <Input
                                        id="location"
                                        placeholder=""
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        className={hasAttemptedSubmit && !data.location.trim() ? 'border-red-500' : ''}
                                    />
                                    {hasAttemptedSubmit && !data.location.trim() && (
                                        <p className="text-red-500 text-sm mt-1">Address is required</p>
                                    )}
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
                                    onChange={(e) => {
                                        const validatedValue = validateMobileNumber(e.target.value);
                                        setData('primary_mobile', validatedValue);
                                    }}
                                    className={hasAttemptedSubmit && (!data.primary_mobile || !isMobileNumberValid(data.primary_mobile)) ? 'border-red-500' : ''}
                                />
                                {hasAttemptedSubmit && !data.primary_mobile && (
                                    <p className="text-red-500 text-sm mt-1">Primary Mobile Number is required</p>
                                )}
                                {hasAttemptedSubmit && data.primary_mobile !== '' && !isMobileNumberValid(data.primary_mobile) && (
                                    <p className="text-red-500 text-sm mt-1">Must be exactly 11 digits</p>
                                )}
                                {errors.primary_mobile && <p className="text-red-500 text-sm mt-1">{errors.primary_mobile}</p>}
                            </div>

                            {/* Backup Mobile Number */}
                            <div>
                                <Label htmlFor="backup_mobile">Backup Mobile Number (Optional)</Label>
                                <Input
                                    id="backup_mobile"
                                    placeholder=""
                                    value={data.backup_mobile}
                                    onChange={(e) => {
                                        const validatedValue = validateMobileNumber(e.target.value);
                                        setData('backup_mobile', validatedValue);
                                    }}
                                    className={hasAttemptedSubmit && data.backup_mobile !== '' && !isMobileNumberValid(data.backup_mobile) ? 'border-red-500' : ''}
                                />
                                {hasAttemptedSubmit && data.backup_mobile !== '' && !isMobileNumberValid(data.backup_mobile) && (
                                    <p className="text-red-500 text-sm mt-1">Must be exactly 11 digits</p>
                                )}
                                {errors.backup_mobile && <p className="text-red-500 text-sm mt-1">{errors.backup_mobile}</p>}
                            </div>

                            {/* GPS Coordinates */}
                            <div className="space-y-2">
                                <Label>GPS Coordinate</Label>
                                <MapModal
                                    onLocationSelect={handleMapLocationSelect}
                                    coordinates={coordinates}
                                />
                                {hasAttemptedSubmit && (!data.latitude || !data.longitude) && (
                                    <p className="text-red-500 text-sm mt-1">GPS Coordinate is required</p>
                                )}
                                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                            </div>

                            {/* Active Toggle Switch */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(checked) => setData('active', checked)}
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>

                        </div>
                    </div>
                    
                    {/* Fixed Footer */}
                    <div className="flex-shrink-0">
                        <SheetFooter className="px-4 py-4 flex-row space-x-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1"
                            >
                                {processing ? 'Creating...' : 'Add Contact'}
                            </Button>
                            <SheetClose asChild>
                                <Button variant='outline' type="button" className="flex-1">Cancel</Button>
                            </SheetClose>
                        </SheetFooter>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default AddContacts;