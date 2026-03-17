import { Button } from '@/components/ui/button';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/use-toast';
import { BranchUnitName, ResponderType } from '@/types/contacts-types';
import { router, useForm, usePage } from '@inertiajs/react';
import { MoveLeft, Phone, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';

type PageProps = {
    responderTypes: ResponderType[];
    responseUnits: BranchUnitName[];
};

function AddContacts() {
    const pageProps = usePage<PageProps>().props;
    const responderTypes = pageProps.responderTypes ?? [];
    const responseUnits = pageProps.responseUnits ?? [];
    const [dialogOpen, setDialogOpen] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        branch_unit_name: '',
        branch_unit_abbreviation: '',
        contact_person: '',
        responder_type: '',
        primary_mobile: '',
        backup_mobile: '',
        active: true,
    });

    const responseUnitOptions = useMemo(
        () => responseUnits.map((unit) => unit.name),
        [responseUnits],
    );

    const validateMobileNumber = (value: string): string => {
        const cleanValue = value.replace(/\D/g, '');

        return cleanValue.slice(0, 11);
    };

    const isMobileNumberValid = (value: string): boolean => /^\d{11}$/.test(value);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        if (!data.branch_unit_name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Branch/Unit Full Name is required.',
                variant: 'destructive',
            });

            return;
        }

        if (!data.branch_unit_abbreviation.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Branch/Unit abbreviation is required.',
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

        post('/contacts', {
            onSuccess: () => {
                router.flushAll();
                reset();
                setDialogOpen(false);
                setHasAttemptedSubmit(false);
                toast({
                    title: 'Success',
                    description: 'Contact created successfully!',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'An error occurred while creating the contact.',
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
                    setHasAttemptedSubmit(false);
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
                        <DialogTitle>Add Contact</DialogTitle>
                        <DialogDescription>
                            Add responder details and communication data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="contact_person">Contact Person (Optional)</Label>
                                <Input
                                    id="contact_person"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                />
                                {errors.contact_person && (
                                    <p className="mt-1 text-sm text-red-500">{errors.contact_person}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="branch_unit_name">Branch/Unit Full Name</Label>
                                <Input
                                    id="branch_unit_name"
                                    list="response-unit-options"
                                    value={data.branch_unit_name}
                                    onChange={(e) => setData('branch_unit_name', e.target.value)}
                                    placeholder="Type full branch/unit name"
                                    className={hasAttemptedSubmit && !data.branch_unit_name.trim() ? 'border-red-500' : ''}
                                />
                                <datalist id="response-unit-options">
                                    {responseUnitOptions.map((unitName) => (
                                        <option key={unitName} value={unitName} />
                                    ))}
                                </datalist>
                                {hasAttemptedSubmit && !data.branch_unit_name.trim() && (
                                    <p className="mt-1 text-sm text-red-500">Branch/Unit Full Name is required.</p>
                                )}
                                {errors.branch_unit_name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.branch_unit_name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="branch_unit_abbreviation">Branch/Unit Abbreviation</Label>
                                <Input
                                    id="branch_unit_abbreviation"
                                    value={data.branch_unit_abbreviation}
                                    onChange={(e) => setData('branch_unit_abbreviation', e.target.value.toUpperCase())}
                                    placeholder="Type abbreviation (e.g., BFP)"
                                    className={hasAttemptedSubmit && !data.branch_unit_abbreviation.trim() ? 'border-red-500' : ''}
                                />
                                {hasAttemptedSubmit && !data.branch_unit_abbreviation.trim() && (
                                    <p className="mt-1 text-sm text-red-500">Branch/Unit abbreviation is required.</p>
                                )}
                                {errors.branch_unit_abbreviation && (
                                    <p className="mt-1 text-sm text-red-500">{errors.branch_unit_abbreviation}</p>
                                )}
                            </div>

                            <div>
                                <Label>Responder Type</Label>
                                <Select
                                    value={data.responder_type}
                                    onValueChange={(value) => setData('responder_type', value)}
                                >
                                    <SelectTrigger className={hasAttemptedSubmit && !data.responder_type ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select responder type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {responderTypes.map((type) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasAttemptedSubmit && !data.responder_type && (
                                    <p className="mt-1 text-sm text-red-500">Responder Type is required.</p>
                                )}
                                {errors.responder_type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.responder_type}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">Communication Data</Label>
                            </div>

                            <div>
                                <Label htmlFor="primary_mobile">Primary Mobile Number</Label>
                                <Input
                                    id="primary_mobile"
                                    value={data.primary_mobile}
                                    onChange={(e) => setData('primary_mobile', validateMobileNumber(e.target.value))}
                                    className={
                                        hasAttemptedSubmit &&
                                            (!data.primary_mobile || !isMobileNumberValid(data.primary_mobile))
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit && !data.primary_mobile && (
                                    <p className="mt-1 text-sm text-red-500">Primary mobile number is required.</p>
                                )}
                                {hasAttemptedSubmit && data.primary_mobile && !isMobileNumberValid(data.primary_mobile) && (
                                    <p className="mt-1 text-sm text-red-500">Must be exactly 11 digits.</p>
                                )}
                                {errors.primary_mobile && (
                                    <p className="mt-1 text-sm text-red-500">{errors.primary_mobile}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="backup_mobile">Backup Mobile Number (Optional)</Label>
                                <Input
                                    id="backup_mobile"
                                    value={data.backup_mobile}
                                    onChange={(e) => setData('backup_mobile', validateMobileNumber(e.target.value))}
                                    className={
                                        hasAttemptedSubmit &&
                                            data.backup_mobile !== '' &&
                                            !isMobileNumberValid(data.backup_mobile)
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {hasAttemptedSubmit && data.backup_mobile !== '' && !isMobileNumberValid(data.backup_mobile) && (
                                    <p className="mt-1 text-sm text-red-500">Must be exactly 11 digits.</p>
                                )}
                                {errors.backup_mobile && (
                                    <p className="mt-1 text-sm text-red-500">{errors.backup_mobile}</p>
                                )}
                            </div>

                            <div className="rounded-md border border-input/70 bg-muted/20 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="active" className="text-sm font-medium">
                                            Active Status
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Active contacts are included in responder dispatch.
                                        </p>
                                    </div>
                                    <Switch
                                        id="active"
                                        checked={data.active}
                                        onCheckedChange={(checked) => setData('active', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" type="button" className="flex-1">
                                    <MoveLeft className="inline h-4 w-4" />
                                    Close
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing} className="flex-2">
                                {processing ? <Spinner className="inline h-4 w-4" /> : <Phone className="inline h-4 w-4" />}
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
