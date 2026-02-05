import { MapModal } from '@/components/map-modal';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/use-toast';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, MoveLeft, Phone, Plus } from 'lucide-react';
import React, { useState } from 'react';

type ResponderType = {
    id: number;
    name: string;
};

type BranchUnitName = {
    id: number;
    name: string;
};

type Location = {
    id: number;
    name: string;
};

type SelectionState = {
    value: ResponderType | BranchUnitName | Location | null;
    open: boolean;
};

type PageProps = {
    responderTypes: ResponderType[];
    branchUnitNames: BranchUnitName[];
    packageLocations: Location[];
};

function AddContacts() {
    const { responderTypes, branchUnitNames, packageLocations } =
        usePage<PageProps>().props;
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
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
    const [branchUnitNameState, setBranchUnitNameState] =
        useState<SelectionState>({
            value: null,
            open: false,
        });

    const [responderTypeState, setResponderTypeState] =
        useState<SelectionState>({
            value: null,
            open: false,
        });

    const [locationState, setLocationState] = useState<SelectionState>({
        value: null,
        open: false,
    });

    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: '',
    });

    // Handlers for branch/unit name selection
    const handleBranchUnitNameSelect = (selected: BranchUnitName | null) => {
        setBranchUnitNameState({
            value: selected,
            open: false,
        });
        setData('branch_unit_name', selected ? selected.name : '');
    };

    // Handlers for responder type selection
    const handleResponderTypeSelect = (selected: ResponderType | null) => {
        setResponderTypeState({
            value: selected,
            open: false,
        });
        setData('responder_type', selected ? selected.name : '');
    };

    // Handlers for location selection
    const handleLocationSelect = (selected: Location | null) => {
        setLocationState({
            value: selected,
            open: false,
        });
        setData('location', selected ? selected.name : '');
    };

    const handleMapLocationSelect = (location: {
        lat: number;
        lng: number;
    }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
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
                title: 'Validation Error',
                description: 'Branch/Unit Name is required.',
                variant: 'destructive',
            });
            return;
        }

        if (!data.responder_type) {
            toast({
                title: 'Validation Error',
                description: 'Responder Type is required.',
                variant: 'destructive',
            });
            return;
        }

        if (!data.location.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Package is required.',
                variant: 'destructive',
            });
            return;
        }

        if (!data.primary_mobile) {
            toast({
                title: 'Validation Error',
                description: 'Primary Mobile Number is required.',
                variant: 'destructive',
            });
            return;
        }

        // Validate mobile numbers format
        if (!isMobileNumberValid(data.primary_mobile)) {
            toast({
                title: 'Validation Error',
                description: 'Primary mobile number must be exactly 11 digits.',
                variant: 'destructive',
            });
            return;
        }

        if (data.backup_mobile && !isMobileNumberValid(data.backup_mobile)) {
            toast({
                title: 'Validation Error',
                description: 'Backup mobile number must be exactly 11 digits.',
                variant: 'destructive',
            });
            return;
        }

        if (!data.latitude || !data.longitude) {
            toast({
                title: 'Validation Error',
                description: 'GPS Coordinate is required.',
                variant: 'destructive',
            });
            return;
        }

        post('/contacts', {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                reset();
                setDialogOpen(false);
                setHasAttemptedSubmit(false);
                // Reset all state when successful
                setBranchUnitNameState({ value: null, open: false });
                setResponderTypeState({ value: null, open: false });
                setLocationState({ value: null, open: false });
                setCoordinates({ latitude: '', longitude: '' });
                toast({
                    title: 'Success',
                    description: 'Contact created successfully!',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description:
                        'An error occurred while creating the contact.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                    // Reset all states when closing
                    setHasAttemptedSubmit(false);
                    setBranchUnitNameState({ value: null, open: false });
                    setResponderTypeState({ value: null, open: false });
                    setLocationState({ value: null, open: false });
                    setCoordinates({ latitude: '', longitude: '' });
                    reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4" /> Add Contacts
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
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>Add Contacts</DialogTitle>
                        <DialogDescription>
                            Responder details, barangay, phones and service
                            radius
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            {/* Contact Person (Optional) */}
                            <div>
                                <Label htmlFor="contact_person">
                                    Contact Person (Optional)
                                </Label>
                                <Input
                                    id="contact_person"
                                    placeholder=""
                                    value={data.contact_person}
                                    onChange={(e) =>
                                        setData(
                                            'contact_person',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.contact_person && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.contact_person}
                                    </p>
                                )}
                            </div>

                            {/* Branch/Unit Name - Now a Dropdown */}
                            <div>
                                <Label>Branch/Unit Name</Label>
                                <Popover
                                    open={branchUnitNameState.open}
                                    onOpenChange={(open) =>
                                        setBranchUnitNameState({
                                            ...branchUnitNameState,
                                            open,
                                        })
                                    }
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={
                                                branchUnitNameState.open
                                            }
                                            className={`w-full justify-between ${hasAttemptedSubmit && !data.branch_unit_name ? 'border-red-500' : ''}`}
                                        >
                                            {branchUnitNameState.value
                                                ? branchUnitNameState.value.name
                                                : 'Select Branch/Unit'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch/unit..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    No branch/unit found.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {branchUnitNames.map(
                                                        (branch) => (
                                                            <CommandItem
                                                                key={branch.id}
                                                                value={
                                                                    branch.name
                                                                }
                                                                onSelect={() =>
                                                                    handleBranchUnitNameSelect(
                                                                        branch,
                                                                    )
                                                                }
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'h-4 w-4',
                                                                        branchUnitNameState
                                                                            .value
                                                                            ?.id ===
                                                                            branch.id
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                {branch.name}
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {hasAttemptedSubmit &&
                                    !data.branch_unit_name && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Branch/Unit Name is required
                                        </p>
                                    )}
                                {errors.branch_unit_name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.branch_unit_name}
                                    </p>
                                )}
                            </div>

                            {/* Responder Type and Package - Side by Side */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Responder Type */}
                                <div>
                                    <Label>Responder Type</Label>
                                    <Popover
                                        open={responderTypeState.open}
                                        onOpenChange={(open) =>
                                            setResponderTypeState({
                                                ...responderTypeState,
                                                open,
                                            })
                                        }
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={
                                                    responderTypeState.open
                                                }
                                                className={`w-full justify-between ${hasAttemptedSubmit && !data.responder_type ? 'border-red-500' : ''}`}
                                            >
                                                {responderTypeState.value
                                                    ? responderTypeState.value
                                                        .name
                                                    : 'Select Type'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Search responder type..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No responder type found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {responderTypes.map(
                                                            (type) => (
                                                                <CommandItem
                                                                    key={
                                                                        type.id
                                                                    }
                                                                    value={
                                                                        type.name
                                                                    }
                                                                    onSelect={() =>
                                                                        handleResponderTypeSelect(
                                                                            type,
                                                                        )
                                                                    }
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'h-4 w-4',
                                                                            responderTypeState
                                                                                .value
                                                                                ?.id ===
                                                                                type.id
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    {type.name}
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {hasAttemptedSubmit &&
                                        !data.responder_type && (
                                            <p className="mt-1 text-sm text-red-500">
                                                Responder Type is required
                                            </p>
                                        )}
                                    {errors.responder_type && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.responder_type}
                                        </p>
                                    )}
                                </div>

                                {/* Package - Dropdown */}
                                <div>
                                    <Label>Package</Label>
                                    <Popover
                                        open={locationState.open}
                                        onOpenChange={(open) =>
                                            setLocationState({
                                                ...locationState,
                                                open,
                                            })
                                        }
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={
                                                    locationState.open
                                                }
                                                className={`w-full justify-between ${hasAttemptedSubmit && !data.location ? 'border-red-500' : ''}`}
                                            >
                                                {locationState.value
                                                    ? locationState.value.name
                                                    : 'Select Package'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Search package..." />
                                                <CommandList className="max-h-[300px] overflow-y-auto">
                                                    <CommandEmpty>
                                                        No package found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {packageLocations.map(
                                                            (location) => (
                                                                <CommandItem
                                                                    key={
                                                                        location.id
                                                                    }
                                                                    value={
                                                                        location.name
                                                                    }
                                                                    onSelect={() =>
                                                                        handleLocationSelect(
                                                                            location,
                                                                        )
                                                                    }
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'h-4 w-4',
                                                                            locationState
                                                                                .value
                                                                                ?.id ===
                                                                                location.id
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    {
                                                                        location.name
                                                                    }
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {hasAttemptedSubmit && !data.location && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Package is required
                                        </p>
                                    )}
                                    {errors.location && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* GPS Coordinates - Barangay 176E Area */}
                            <div className="space-y-2">
                                <Label>
                                    GPS Coordinate (Barangay 176E, Bagong
                                    Silang)
                                </Label>
                                <MapModal
                                    onLocationSelect={handleMapLocationSelect}
                                    coordinates={coordinates}
                                />
                                {hasAttemptedSubmit &&
                                    (!data.latitude || !data.longitude) && (
                                        <p className="mt-1 text-sm text-red-500">
                                            GPS Coordinate is required
                                        </p>
                                    )}
                                {errors.latitude && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.latitude}
                                    </p>
                                )}
                                {errors.longitude && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.longitude}
                                    </p>
                                )}
                            </div>

                            {/* Communication Data Section */}
                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">
                                    Communication Data
                                </Label>
                            </div>

                            {/* Primary Mobile Number (Hotline) */}
                            <div>
                                <Label htmlFor="primary_mobile">
                                    Primary Mobile Number (Hotline)
                                </Label>
                                <Input
                                    id="primary_mobile"
                                    placeholder=""
                                    value={data.primary_mobile}
                                    onChange={(e) => {
                                        const validatedValue =
                                            validateMobileNumber(
                                                e.target.value,
                                            );
                                        setData(
                                            'primary_mobile',
                                            validatedValue,
                                        );
                                    }}
                                    className={
                                        hasAttemptedSubmit &&
                                            (!data.primary_mobile ||
                                                !isMobileNumberValid(
                                                    data.primary_mobile,
                                                ))
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit && !data.primary_mobile && (
                                    <p className="mt-1 text-sm text-red-500">
                                        Primary Mobile Number is required
                                    </p>
                                )}
                                {hasAttemptedSubmit &&
                                    data.primary_mobile !== '' &&
                                    !isMobileNumberValid(
                                        data.primary_mobile,
                                    ) && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Must be exactly 11 digits
                                        </p>
                                    )}
                                {errors.primary_mobile && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.primary_mobile}
                                    </p>
                                )}
                            </div>

                            {/* Backup Mobile Number */}
                            <div>
                                <Label htmlFor="backup_mobile">
                                    Backup Mobile Number (Optional)
                                </Label>
                                <Input
                                    id="backup_mobile"
                                    placeholder=""
                                    value={data.backup_mobile}
                                    onChange={(e) => {
                                        const validatedValue =
                                            validateMobileNumber(
                                                e.target.value,
                                            );
                                        setData(
                                            'backup_mobile',
                                            validatedValue,
                                        );
                                    }}
                                    className={
                                        hasAttemptedSubmit &&
                                            data.backup_mobile !== '' &&
                                            !isMobileNumberValid(data.backup_mobile)
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit &&
                                    data.backup_mobile !== '' &&
                                    !isMobileNumberValid(
                                        data.backup_mobile,
                                    ) && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Must be exactly 11 digits
                                        </p>
                                    )}
                                {errors.backup_mobile && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.backup_mobile}
                                    </p>
                                )}
                            </div>

                            {/* Active Toggle Switch */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(checked) =>
                                        setData('active', checked)
                                    }
                                />
                                <Label htmlFor="active">Active</Label>
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
                                    <Phone className="inline h-4 w-4" />
                                )}
                                {processing ? 'Creating...' : 'Add Contact'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddContacts;
