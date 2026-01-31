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
import { location_T } from '@/types/location-types';
import { roles_T } from '@/types/role-types';
import { useForm } from '@inertiajs/react';
import { MoveLeft, Plus, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';

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
};

function CreateUsers({
    roles,
    locations,
    puroks = [], // Default to empty array if not passed
}: {
    roles: roles_T[];
    locations: location_T[];
    puroks?: any[]; // Using any for now to avoid extensive type definitions, or define interface
}) {
    const { data, setData, post, processing, errors, reset } =
        useForm<CreateUserForm>({
            first_name: '',
            middle_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            assigned_brgy: '',
            role_id: '',
            password: '',
            password_confirmation: '',
            suffix: '',
            office_address: '',
            latitude: '',
            longitude: '',
            purok_id: '',
        });

    const [clientErrors, setClientErrors] = useState<Partial<CreateUserForm>>(
        {},
    );

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

    const validatePhoneNumber = (value: string) => {
        if (!value.trim()) {
            return 'Phone number is required';
        }
        if (!/^09\d{9}$/.test(value)) {
            return 'Phone number must be 11 digits starting with 09 (e.g., 09123456789)';
        }
        return '';
    };

    const validatePassword = (value: string, roleId?: string) => {
        const isPurokLeader = (roleId || data.role_id) === '2';
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
        const isPurokLeader = (roleId || data.role_id) === '2';
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
                error = validatePhoneNumber(value);
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
            validatePhoneNumber(data.phone_number) || undefined;
        validationErrors.password =
            validatePassword(data.password) || undefined;
        validationErrors.password_confirmation =
            validatePasswordConfirmation(
                data.password_confirmation,
                data.password,
            ) || undefined;

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

        console.log('Validation errors:', validationErrors);
        console.log('Form data:', data);

        if (Object.keys(validationErrors).length > 0) {
            setClientErrors(validationErrors);
            console.log('Form has validation errors, not submitting');
            return;
        }

        // Clear client errors and submit
        setClientErrors({});
        console.log('Submitting form...');
        console.log('Form data being sent:', data);
        post('/user', {
            onSuccess: () => {
                console.log('User created successfully');
                reset();
                setClientErrors({});
                // Force page reload to show the new user
                window.location.href = '/users';
            },
            onError: (errors) => {
                console.log('Server validation errors:', errors);
                console.error(
                    'Full error object:',
                    JSON.stringify(errors, null, 2),
                );
            },
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="cursor-pointer px-4 py-2">
                    <Plus /> Add User
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
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account with their personal
                            information and role assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-2">
                        <div className="grid flex-1 auto-rows-min gap-4">
                            <div className="grid pb-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Personal Information
                                </p>
                            </div>
                            {/* First Name and Middle Name */}
                            <div className="grid w-full grid-cols-5 gap-4">
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="first-name">
                                        First Name
                                    </Label>
                                    <div className="relative">
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
                                        {(errors.first_name ||
                                            clientErrors.first_name) && (
                                            <span className="absolute -bottom-5 left-0 text-xs text-[var(--destructive)]">
                                                {errors.first_name ||
                                                    clientErrors.first_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 grid gap-2">
                                    <Label htmlFor="middle-name">
                                        Middle Name
                                    </Label>
                                    <div className="relative">
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
                                        {clientErrors.middle_name && (
                                            <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                {clientErrors.middle_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Last Name and Suffix */}
                            <div className="grid w-full grid-cols-4 gap-4">
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="last-name">Last Name</Label>
                                    <div className="relative">
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
                                        {(errors.last_name ||
                                            clientErrors.last_name) && (
                                            <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                {errors.last_name ||
                                                    clientErrors.last_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-1 grid gap-2">
                                    <Label htmlFor="suffix">
                                        Suffix (Optional)
                                    </Label>
                                    <Input
                                        id="suffix"
                                        value={data.suffix}
                                        onChange={(e) =>
                                            setData('suffix', e.target.value)
                                        }
                                        placeholder="Jr., Sr., III, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid flex-1 auto-rows-min gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Contact Information
                                </p>
                            </div>
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
                                        {(errors.email ||
                                            clientErrors.email) && (
                                            <span className="mt-1 block text-xs text-red-500">
                                                {errors.email ||
                                                    clientErrors.email}
                                            </span>
                                        )}
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

                        <div className="grid flex-1 auto-rows-min gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Role & Location
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <div>
                                        <Select
                                            value={data.role_id}
                                            onValueChange={(value) => {
                                                setData('role_id', value);
                                                setClientErrors((prev) => ({
                                                    ...prev,
                                                    role_id: undefined,
                                                }));
                                                // Reset location when role changes
                                                setData(prev => ({ ...prev, assigned_brgy: '', purok_id: '' }));
                                            }}
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors.role_id ||
                                                    clientErrors.role_id
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles
                                                    .filter(
                                                        (role) =>
                                                            role.name !==
                                                            'Citizen',
                                                    )
                                                    .map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={role.id.toString()}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {(errors.role_id ||
                                            clientErrors.role_id) && (
                                            <span className="mt-1 block text-xs text-red-500">
                                                {errors.role_id ||
                                                    clientErrors.role_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="location">Location / Assignment</Label>
                                    <div>
                                        {data.role_id === '2' ? (
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
                                                                location.location_name
                                                            }
                                                        >
                                                            {location.location_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
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

                        {/* Map Selector for Purok Leaders */}
                        {data.role_id === '2' && (
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <Label>Select Territory (Purok)</Label>
                                <div className="rounded-md border p-1">
                                    <PurokSelectorMap 
                                        puroks={puroks}
                                        selectedPurokId={data.purok_id ? parseInt(data.purok_id) : null}
                                        onSelectPurok={(id, name) => {
                                            setData(prev => ({
                                                ...prev,
                                                purok_id: id.toString(),
                                                assigned_brgy: name
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

                        <div className="grid flex-1 auto-rows-min gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Security
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {data.role_id === '2' ? 'PIN' : 'Password'}
                                </Label>
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
                                    {(errors.password ||
                                        clientErrors.password) && (
                                        <span className="mt-1 block text-xs text-red-500">
                                            {errors.password ||
                                                clientErrors.password}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password-confirmation">
                                    {data.role_id === '2'
                                        ? 'Confirm PIN'
                                        : 'Confirm Password'}
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
        </Dialog>
    );
}

export default CreateUsers;
