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
import PurokSelectorMap from '@/components/purok-selector-map';
import { toast } from '@/components/use-toast';
import { locations } from '@/lib/packages';
import { roles_T } from '@/types/role-types';
import { useForm, usePage, router } from '@inertiajs/react';
import { MoveLeft, Plus, UserPlus, Info } from 'lucide-react';
import { FormEvent, useState, useEffect } from 'react';
import { PinDisplayModal } from '@/components/PinDisplayModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

type CreateUserForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    assigned_brgy: string;
    role_id: string;
    password: string;
    password_confirmation: string;
    suffix?: string;
    office_address?: string;
    latitude?: string;
    longitude?: string;
    purok_id?: string;
    id_number?: string;
};

function CreateUsers({
    roles,
    puroks = [], // Default to empty array if not passed
}: {
    roles: roles_T[];
    puroks?: any[]; // Using any for now to avoid extensive type definitions, or define interface
}) {
    const pageProps = usePage().props as any;
    const actorRoleName = (pageProps?.auth?.user?.role?.name || '').toLowerCase();
    const defaultPurokLeaderRoleId =
        roles.find((role) => role.name.toLowerCase() === 'purok leader')?.id?.toString() || '';
    const defaultOperatorRoleId =
        roles.find((role) => role.name.toLowerCase() === 'operator')?.id?.toString() || '';

    const isSuperadminActor = actorRoleName === 'superadmin';
    const defaultRoleId = isSuperadminActor ? defaultOperatorRoleId : defaultPurokLeaderRoleId;
    const targetAccountLabel = isSuperadminActor ? 'Operator' : 'Purok Leader';
    const defaultAssignedBrgy = isSuperadminActor ? 'BRGY 176 E' : '';

    const [open, setOpen] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [generatedPin, setGeneratedPin] = useState<string>('');
    const [purokLeaderName, setPurokLeaderName] = useState<string>('');
    const { flash } = pageProps;
    const { data, setData, post, processing, errors, reset } =
        useForm<CreateUserForm>({
            first_name: '',
            middle_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            assigned_brgy: defaultAssignedBrgy,
            role_id: defaultRoleId,
            password: '',
            password_confirmation: '',
            suffix: '',
            office_address: '',
            latitude: '',
            longitude: '',
            purok_id: '',
            id_number: '',
        });

    const [clientErrors, setClientErrors] = useState<Partial<CreateUserForm>>(
        {},
    );

    // Handle generated PIN from backend
    useEffect(() => {
        if (flash?.generated_pin && flash?.purok_leader_name) {
            setGeneratedPin(flash.generated_pin);
            setPurokLeaderName(flash.purok_leader_name);
            setShowPinModal(true);
        }
    }, [flash]);

    const getRoleNameById = (roleId?: string) => {
        const role = roles.find((item) => item.id.toString() === (roleId || data.role_id));
        return role?.name.toLowerCase() ?? '';
    };

    const isSelectedPurokLeader = (roleId?: string) =>
        getRoleNameById(roleId) === 'purok leader';

    const isSelectedOperator = (roleId?: string) =>
        getRoleNameById(roleId) === 'operator';

    // Validation functions
    const validateName = (
        value: string,
        fieldName: string,
        required = true,
    ) => {
        if (required && !value.trim()) {
            return `${fieldName} is required`;
        }
        if (value && !/^[a-zA-Z\s'-]*$/.test(value)) {
            return `${fieldName} can only contain letters and spaces`;
        }
        return '';
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const validatePhoneNumber = (value: string, required: boolean) => {
        if (required && !value.trim()) {
            return 'Phone number is required for Purok Leader';
        }
        if (!required && !value.trim()) {
            return '';
        }

        if (!/^09\d{9}$/.test(value)) {
            return 'Phone number must be 11 digits starting with 09 (e.g., 09123456789)';
        }
        return '';
    };

    const validateIdNumber = (value: string, required: boolean) => {
        if (required && !value.trim()) {
            return 'ID Number is required for Purok Leader';
        }
        if (!required && !value.trim()) {
            return '';
        }
        if (!/^\d+$/.test(value)) {
            return 'ID Number must contain digits only';
        }
        return '';
    };

    const validatePassword = (value: string, roleId?: string) => {
        const isPurokLeader = isSelectedPurokLeader(roleId);
        const fieldName = isPurokLeader ? 'PIN' : 'Password';

        if (!value) {
            return `${fieldName} is required`;
        }

        // Different validation for PIN (Purok Leader) vs Password
        if (isPurokLeader) {
            // PIN should only contain numbers
            if (!/^\d+$/.test(value)) {
                return 'PIN must contain only numbers';
            }
            if (value.length < 4) {
                return 'PIN must be at least 4 digits';
            }
        } else {
            // Regular password validation
            if (value.length < 8) {
                return `${fieldName} must be at least 8 characters`;
            }
            if (!/[a-zA-Z]/.test(value)) {
                return `${fieldName} must contain at least one letter`;
            }
            if (!/[0-9]/.test(value)) {
                return `${fieldName} must contain at least one number`;
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                return `${fieldName} must contain at least one symbol`;
            }
        }
        return '';
    };

    const validatePasswordConfirmation = (
        value: string,
        password: string,
        roleId?: string,
    ) => {
        const isPurokLeader = isSelectedPurokLeader(roleId);
        const fieldName = isPurokLeader ? 'PIN' : 'Password';

        if (!value) {
            return `${fieldName} confirmation is required`;
        }
        if (value !== password) {
            return `${fieldName}s do not match`;
        }
        return '';
    };

    // Handle input changes with validation
    const handleInputChange = (field: keyof CreateUserForm, value: string) => {
        setData(field, value);

        // Clear previous client error for this field
        setClientErrors((prev) => ({ ...prev, [field]: undefined }));

        // Validate on change
        let error = '';
        switch (field) {
            case 'first_name':
                error = validateName(value, 'First name');
                break;
            case 'middle_name':
                error = validateName(value, 'Middle name', false);
                break;
            case 'last_name':
                error = validateName(value, 'Last name');
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'phone_number':
                error = validatePhoneNumber(value, isSelectedPurokLeader());
                break;
            case 'id_number':
                error = validateIdNumber(value, isSelectedPurokLeader());
                break;
            case 'password':
                error = validatePassword(value);
                // Also revalidate password confirmation if it exists
                if (data.password_confirmation) {
                    const confirmError = validatePasswordConfirmation(
                        data.password_confirmation,
                        value,
                    );
                    setClientErrors((prev) => ({
                        ...prev,
                        password_confirmation: confirmError || undefined,
                    }));
                }
                break;
            case 'password_confirmation':
                error = validatePasswordConfirmation(value, data.password);
                break;
        }

        if (error) {
            setClientErrors((prev) => ({ ...prev, [field]: error }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation before submission
        const validationErrors: Partial<CreateUserForm> = {};

        validationErrors.first_name =
            validateName(data.first_name, 'First name') || undefined;
        validationErrors.middle_name =
            validateName(data.middle_name, 'Middle name', false) || undefined;
        validationErrors.last_name =
            validateName(data.last_name, 'Last name') || undefined;
        validationErrors.email = validateEmail(data.email) || undefined;
        validationErrors.phone_number =
            validatePhoneNumber(data.phone_number, isSelectedPurokLeader()) || undefined;
        validationErrors.id_number =
            validateIdNumber(data.id_number || '', isSelectedPurokLeader()) || undefined;

        // Password validation only for non-Purok Leaders (Purok Leaders have auto-generated PIN)
        if (!isSelectedPurokLeader()) {
            validationErrors.password =
                validatePassword(data.password) || undefined;
            validationErrors.password_confirmation =
                validatePasswordConfirmation(
                    data.password_confirmation,
                    data.password,
                ) || undefined;
        }

        // Check if role_id and assigned_brgy are selected
        if (!data.role_id) {
            validationErrors.role_id = 'Please select a role';
        }
        if (!data.assigned_brgy) {
            validationErrors.assigned_brgy = 'Please select a location';
        }

        // Remove undefined values
        Object.keys(validationErrors).forEach((key) => {
            if (validationErrors[key as keyof CreateUserForm] === undefined) {
                delete validationErrors[key as keyof CreateUserForm];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setClientErrors(validationErrors);
            return;
        }

        // Clear client errors and submit
        setClientErrors({});

        // Transform data to remove password fields for Purok Leaders (auto-generated PIN)
        let submitData = { ...data };
        if (isSelectedPurokLeader()) {
            const { password, password_confirmation, ...dataWithoutPassword } = data;
            submitData = dataWithoutPassword as CreateUserForm;
        }

        router.post('/user', submitData, {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'User created successfully.',
                });
                reset();
                setClientErrors({});
                setOpen(false);
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description: Object.values(errors).flat().join(', ') || 'Failed to create user.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    reset();
                    setClientErrors({});
                    setData((prev) => ({
                        ...prev,
                        role_id: defaultRoleId,
                        assigned_brgy: defaultAssignedBrgy,
                        purok_id: '',
                    }));
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="cursor-pointer px-4 py-2">
                    <Plus /> Add {targetAccountLabel}
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>Add New {targetAccountLabel}</DialogTitle>
                        <DialogDescription>
                            Create a {targetAccountLabel} account with their personal
                            information and role assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        <div className="grid flex-1 auto-rows-min">

                            {/* First Name and Middle Name */}
                            <div className="grid w-full grid-cols-5 gap-4">
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="first-name">
                                        First Name
                                    </Label>
                                    <div>
                                        <Input
                                            id="first-name"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter first name"
                                            className={
                                                errors.first_name ||
                                                    clientErrors.first_name
                                                    ? 'border-[var(--destructive)] focus:ring-[var(--ring)]'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.first_name ||
                                                clientErrors.first_name) && (
                                                    <span className="mt-1 block text-xs text-[var(--destructive)]">
                                                        {errors.first_name ||
                                                            clientErrors.first_name}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 grid gap-2">
                                    <Label htmlFor="middle-name">
                                        Middle Name
                                    </Label>
                                    <div>
                                        <Input
                                            id="middle-name"
                                            value={data.middle_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'middle_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter middle name (optional)"
                                            className={
                                                clientErrors.middle_name
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {clientErrors.middle_name && (
                                                <span className="mt-1 block text-xs text-red-500">
                                                    {clientErrors.middle_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Last Name and Suffix */}
                            <div className="grid w-full grid-cols-4 gap-4">
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="last-name">Last Name</Label>
                                    <div>
                                        <Input
                                            id="last-name"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter last name"
                                            className={
                                                errors.last_name ||
                                                    clientErrors.last_name
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.last_name ||
                                                clientErrors.last_name) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.last_name ||
                                                            clientErrors.last_name}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 grid gap-2">
                                    <Label htmlFor="suffix">
                                        Suffix (Optional)
                                    </Label>
                                    <div>
                                        <Input
                                            id="suffix"
                                            value={data.suffix}
                                            onChange={(e) =>
                                                setData('suffix', e.target.value)
                                            }
                                            placeholder="Jr., Sr., III, etc."
                                        />
                                        <div className="h-5"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid flex-1 auto-rows-min gap-2">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder=""
                                            className={
                                                errors.email ||
                                                    clientErrors.email
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.email ||
                                                clientErrors.email) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.email ||
                                                            clientErrors.email}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone-number">
                                        Phone Number
                                    </Label>
                                    <div>
                                        <Input
                                            id="phone-number"
                                            value={data.phone_number}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'phone_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder=""
                                            className={
                                                errors.phone_number ||
                                                    clientErrors.phone_number
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.phone_number ||
                                                clientErrors.phone_number) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.phone_number ||
                                                            clientErrors.phone_number}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isSelectedPurokLeader() && (
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid gap-2 mt-2">
                                        <Label htmlFor="id-number">ID Number</Label>
                                        <div>
                                            <Input
                                                id="id-number"
                                                value={data.id_number}
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                onChange={(e) =>
                                                    handleInputChange('id_number', e.target.value.replace(/\D/g, ''))
                                                }
                                                placeholder="Enter the last 4 digit ID number of the Purok Leader"
                                                className={
                                                    errors.id_number || clientErrors.id_number
                                                        ? 'border-[var(--destructive)] focus:ring-[var(--ring)]'
                                                        : ''
                                                }
                                            />
                                            <div className="h-5">
                                                {(errors.id_number || clientErrors.id_number) && (
                                                    <span className="mt-1 block text-xs text-[var(--destructive)]">
                                                        {errors.id_number || clientErrors.id_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid flex-1 auto-rows-min gap-2">

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Location / Assignment</Label>
                                    <div>
                                        {isSelectedOperator() ? (
                                            // Operator: Fixed location BRGY 176 E
                                            <Input
                                                value="BRGY 176 E"
                                                readOnly
                                                className="bg-muted cursor-not-allowed"
                                            />
                                        ) : isSelectedPurokLeader() ? (
                                            // Purok Leader: Read-only display of selected Purok
                                            <Input
                                                value={data.assigned_brgy || "Select from map below"}
                                                readOnly
                                                className="bg-muted"
                                                placeholder="Select a territory below"
                                            />
                                        ) : (
                                            // Other Roles: Standard Select
                                            <Select
                                                value={data.assigned_brgy}
                                                onValueChange={(value) => {
                                                    setData('assigned_brgy', value);
                                                    setClientErrors((prev) => ({
                                                        ...prev,
                                                        assigned_brgy: undefined,
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.assigned_brgy ||
                                                            clientErrors.assigned_brgy
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((location) => (
                                                        <SelectItem
                                                            key={location.id}
                                                            value={
                                                                location.name
                                                            }
                                                        >
                                                            {location.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <div className="h-5">
                                            {(errors.assigned_brgy ||
                                                clientErrors.assigned_brgy) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.assigned_brgy ||
                                                            clientErrors.assigned_brgy}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Selector for Purok Leaders */}
                        {isSelectedPurokLeader() && (
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <Label>Select Territory (Purok)</Label>
                                <div className="rounded-md border p-1">
                                    <PurokSelectorMap
                                        puroks={puroks}
                                        selectedPurokId={data.purok_id ? parseInt(data.purok_id) : null}
                                        onSelectPurok={(id, name, latitude, longitude) => {
                                            setData(prev => ({
                                                ...prev,
                                                purok_id: id.toString(),
                                                assigned_brgy: name,
                                                latitude: latitude.toString(),
                                                longitude: longitude.toString()
                                            }));
                                            setClientErrors(prev => ({
                                                ...prev,
                                                assigned_brgy: undefined
                                            }));
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Green areas are available. Gray areas are already occupied.
                                </p>
                            </div>
                        )}

                        {/* Security Section - Only for non-Purok Leaders */}
                        {!isSelectedPurokLeader() && (
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Security
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder=""
                                            className={
                                                errors.password ||
                                                    clientErrors.password
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.password ||
                                                clientErrors.password) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.password ||
                                                            clientErrors.password}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password-confirmation">
                                        Confirm Password
                                    </Label>
                                    <div>
                                        <Input
                                            id="password-confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder=""
                                            className={
                                                errors.password_confirmation ||
                                                    clientErrors.password_confirmation
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                            }
                                        />
                                        <div className="h-5">
                                            {(errors.password_confirmation ||
                                                clientErrors.password_confirmation) && (
                                                    <span className="mt-1 block text-xs text-red-500">
                                                        {errors.password_confirmation ||
                                                            clientErrors.password_confirmation}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auto-generated PIN info for Purok Leaders */}
                        {isSelectedPurokLeader() && (
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Security
                                    </p>
                                </div>
                                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Auto-Generated PIN:</strong> A secure 4-digit PIN will be automatically generated
                                        for this Purok Leader. You'll see it once after creation to share with them.
                                    </AlertDescription>
                                </Alert>

                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-shrink-0 bg-background px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-dialog-close
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
                                    <UserPlus className="inline h-4 w-4" />
                                )}
                                {processing ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* PIN Display Modal */}
            <PinDisplayModal
                pin={generatedPin}
                name={purokLeaderName}
                isOpen={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setGeneratedPin('');
                    setPurokLeaderName('');
                }}
            />
        </Dialog>
    );
}

export default CreateUsers;
