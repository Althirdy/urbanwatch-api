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
    { id: 1, name: 'Fire' },
    { id: 2, name: 'Emergency' },
    { id: 3, name: 'Crime' },
    { id: 4, name: 'Traffic' },
    { id: 5, name: 'Barangay' },
    { id: 6, name: 'Others' },
]

const branchUnitNames = [
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
    { id: 1, name: 'Pkg. 1A Bicolandia' },
    { id: 2, name: 'Pkg. 1B Powerline' },
    { id: 3, name: 'Pkg. 1C Sampalukan' },
    { id: 4, name: 'Pkg. 2 Botlog' },
    { id: 5, name: 'Pkg. 2 GK Staging' },
    { id: 6, name: 'Pkg. 3 Kaunlaran' },
    { id: 7, name: 'Pkg. 3 Maharlika' },
    { id: 8, name: 'Pkg. 3 Maharlika 2' },
    { id: 9, name: 'Pkg. 3 Damayan' },
    { id: 10, name: 'Pkg. 4A Atlantika' },
    { id: 11, name: 'Pkg. 4B Aklan Wire' },
    { id: 12, name: 'Pkg. 5 San Roque' },
    { id: 13, name: 'Pkg. 5 Brgy. Annex (BFP)' },
    { id: 14, name: 'Pkg. 5 Crasher' },
    { id: 15, name: 'Pkg. 5 Gatnai' },
    { id: 16, name: 'Pkg. 6 Bayanihan' },
    { id: 17, name: 'Pkg. 7A Lakan' },
    { id: 18, name: 'Pkg. 7B PhilRad' },
    { id: 19, name: 'Pkg. 7B  Khulits Court' },
    { id: 20, name: 'Pkg. 7B Dating Daan' },
    { id: 21, name: 'Pkg. 7C GS Senior High' },
    { id: 22, name: 'Pkg. 8A North Cal' },
    { id: 23, name: 'Pkg. 8B Makati' },
    { id: 24, name: 'Pkg. 9 Plaza Maria Upper' },
    { id: 25, name: 'Pkg. 9 Plaza Maria Lower' },
]

type ResponderType = {
    id: number;
    name: string;
}

type BranchUnitName = {
    id: number;
    name: string;
}

type Location = {
    id: number;
    name: string;
}

type SelectionState = {
    value: ResponderType | BranchUnitName | Location | null;
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
    const [branchUnitNameState, setBranchUnitNameState] = useState<SelectionState>({
        value: null,
        open: false
    });

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

    // Handlers for branch/unit name selection
    const handleBranchUnitNameSelect = (selected: BranchUnitName | null) => {
        setBranchUnitNameState({
            value: selected,
            open: false
        });
        setData('branch_unit_name', selected ? selected.name : '');
    };

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
                description: "Package is required.",
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
                setBranchUnitNameState({ value: null, open: false });
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
                setBranchUnitNameState({ value: null, open: false });
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

                            {/* Branch/Unit Name - Now a Dropdown */}
                            <div>
                                <Label>Branch/Unit Name</Label>
                                <Popover open={branchUnitNameState.open} onOpenChange={(open) => setBranchUnitNameState({ ...branchUnitNameState, open })}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={branchUnitNameState.open}
                                            className={`w-full justify-between ${hasAttemptedSubmit && !data.branch_unit_name ? 'border-red-500' : ''}`}
                                        >
                                            {branchUnitNameState.value ? branchUnitNameState.value.name : "Select Branch/Unit"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch/unit..." />
                                            <CommandList>
                                                <CommandEmpty>No branch/unit found.</CommandEmpty>
                                                <CommandGroup>
                                                    {branchUnitNames.map((branch) => (
                                                        <CommandItem
                                                            key={branch.id}
                                                            value={branch.name}
                                                            onSelect={() => handleBranchUnitNameSelect(branch)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    branchUnitNameState.value?.id === branch.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {branch.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {hasAttemptedSubmit && !data.branch_unit_name && (
                                    <p className="text-red-500 text-sm mt-1">Branch/Unit Name is required</p>
                                )}
                                {errors.branch_unit_name && <p className="text-red-500 text-sm mt-1">{errors.branch_unit_name}</p>}
                            </div>

                            {/* Responder Type and Package - Side by Side */}
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

                                {/* Package - Dropdown */}
                                <div>
                                    <Label>Package</Label>
                                    <Popover open={locationState.open} onOpenChange={(open) => setLocationState({ ...locationState, open })}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={locationState.open}
                                                className={`w-full justify-between ${hasAttemptedSubmit && !data.location ? 'border-red-500' : ''}`}
                                            >
                                                {locationState.value ? locationState.value.name : "Select Package"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Search package..." />
                                                <CommandList className="max-h-[300px] overflow-y-auto">
                                                    <CommandEmpty>No package found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {locations.map((location) => (
                                                            <CommandItem
                                                                key={location.id}
                                                                value={location.name}
                                                                onSelect={() => handleLocationSelect(location)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        locationState.value?.id === location.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {location.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {hasAttemptedSubmit && !data.location && (
                                        <p className="text-red-500 text-sm mt-1">Package is required</p>
                                    )}
                                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                                </div>
                            </div>

                            {/* GPS Coordinates - Barangay 176E Area */}
                            <div className="space-y-2">
                                <Label>GPS Coordinate (Barangay 176E, Bagong Silang)</Label>
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