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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/use-toast';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const responderTypes = [
    { id: 1, name: 'Fire' },
    { id: 2, name: 'Emergency' },
    { id: 3, name: 'Crime' },
    { id: 4, name: 'Traffic' },
    { id: 5, name: 'Barangay' },
    { id: 6, name: 'Others' },
];

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
];

import {
    BranchUnitName,
    Contact,
    Location,
    ResponderType,
    SelectionState,
} from '@/types/contacts-types';

interface EditContactsProps {
    contact: Contact;
    children?: React.ReactNode;
}

export default function EditContacts({ contact, children }: EditContactsProps) {
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
    const { data, setData, put, processing, errors, reset } = useForm({
        branch_unit_name: contact.branch_unit_name || '',
        contact_person: contact.contact_person || '',
        responder_type: contact.responder_type || '',
        location: contact.location || '',
        primary_mobile: contact.primary_mobile || '',
        backup_mobile: contact.backup_mobile || '',
        latitude: contact.latitude?.toString() || '',
        longitude: contact.longitude?.toString() || '',
        active: contact.active ?? true,
    });

    // Combined states for selectors
    const [branchUnitNameState, setBranchUnitNameState] =
        useState<SelectionState>({
            value:
                branchUnitNames.find(
                    (branch) => branch.name === contact.branch_unit_name,
                ) || null,
            open: false,
        });

    const [responderTypeState, setResponderTypeState] =
        useState<SelectionState>({
            value:
                responderTypes.find(
                    (type) => type.name === contact.responder_type,
                ) || null,
            open: false,
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

    // Handlers for responder type selection

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

        put(`/contacts/${contact.id}`, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                setDialogOpen(false);
                setHasAttemptedSubmit(false);
                toast({
                    title: 'Success',
                    description: 'Contact updated successfully!',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description:
                        'An error occurred while updating the contact.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    {/* Fixed Header */}
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>
                            Update contact information and details
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
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

                            {/* Branch/Unit Name - Dropdown */}
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
                                            Responder Type is required.
                                        </p>
                                    )}
                                {errors.responder_type && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.responder_type}
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
                                    onChange={(e) =>
                                        setData(
                                            'primary_mobile',
                                            validateMobileNumber(
                                                e.target.value,
                                            ),
                                        )
                                    }
                                    className={
                                        hasAttemptedSubmit &&
                                            !isMobileNumberValid(
                                                data.primary_mobile,
                                            )
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit &&
                                    !data.primary_mobile.trim() && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Primary Mobile Number is required.
                                        </p>
                                    )}
                                {hasAttemptedSubmit &&
                                    data.primary_mobile.trim() &&
                                    !isMobileNumberValid(
                                        data.primary_mobile,
                                    ) && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Mobile number must be exactly 11
                                            digits.
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
                                    Backup Mobile Number
                                </Label>
                                <Input
                                    id="backup_mobile"
                                    placeholder=""
                                    value={data.backup_mobile}
                                    onChange={(e) =>
                                        setData('backup_mobile', e.target.value)
                                    }
                                    className={
                                        hasAttemptedSubmit &&
                                            data.backup_mobile.trim() &&
                                            !isMobileNumberValid(data.backup_mobile)
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit &&
                                    data.backup_mobile.trim() &&
                                    !isMobileNumberValid(
                                        data.backup_mobile,
                                    ) && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Mobile number must be exactly 11
                                            digits.
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

                    {/* Fixed Footer */}
                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-2"
                            >
                                {processing ? 'Updating...' : 'Update Contact'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
