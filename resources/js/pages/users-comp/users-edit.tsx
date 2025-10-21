import { TextField } from '@/components/text-field';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    extractUserFormData,
    getInitials,
    getUserFullName,
} from '@/lib/user-utils';
import { EditUserForm, EditUserProps } from '@/types/user-types';
import { useForm } from '@inertiajs/react';
import { MoveLeft } from 'lucide-react';
import { FormEvent } from 'react';

function EditUser({
    user,
    roles,
    barangays,
    statusOptions,
    children,
}: EditUserProps) {
    const { data, setData, put, processing, errors, reset } =
        useForm<EditUserForm>(extractUserFormData(user));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/user/${user.id}`, {
            onSuccess: () => {
                reset();
                document
                    .querySelector<HTMLButtonElement>('[data-sheet-close]')
                    ?.click();
            },
            preserveScroll: true,
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <div className="flex flex-row items-center gap-4">
                            <Avatar className="h-14 w-14">
                                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                                    {getInitials(user)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <h3 className="text-xl font-semibold">
                                    {getUserFullName(user)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex w-full flex-col justify-start gap-10 px-4 py-2">
                        <div className="flex w-full flex-col gap-6">
                            {/* Personal Information */}
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Personal Information
                                </p>
                                <TextField
                                    id="first-name"
                                    label="First Name"
                                    value={data.first_name}
                                    onChange={(val) =>
                                        setData('first_name', val)
                                    }
                                    placeholder="Enter first name"
                                    error={errors.first_name}
                                    required
                                />
                                <TextField
                                    id="middle-name"
                                    label="Middle Name"
                                    value={data.middle_name}
                                    onChange={(val) =>
                                        setData('middle_name', val)
                                    }
                                    placeholder="Enter middle name"
                                />
                                <TextField
                                    id="last-name"
                                    label="Last Name"
                                    value={data.last_name}
                                    onChange={(val) =>
                                        setData('last_name', val)
                                    }
                                    placeholder="Enter last name"
                                    error={errors.last_name}
                                    required
                                />
                                <TextField
                                    id="suffix"
                                    label="Suffix"
                                    value={data.suffix}
                                    onChange={(val) => setData('suffix', val)}
                                    placeholder="Jr., Sr., III, etc."
                                />
                            </div>
                            {/* Contact Information */}
                            <div className="flex flex-col gap-4">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Contact Information
                                </p>
                                <TextField
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(val) => setData('email', val)}
                                    placeholder="Enter email address"
                                    error={errors.email}
                                    required
                                />
                                <TextField
                                    id="contact"
                                    label="Contact Number"
                                    type="number"
                                    value={data.phone_number}
                                    onChange={(val) =>
                                        setData('phone_number', val)
                                    }
                                    placeholder="Enter contact number"
                                    error={errors.phone_number}
                                    required
                                />
                            </div>
                            {/* Role & Location */}
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Role & Location
                                </p>
                                <div className="flex w-full flex-row gap-4">
                                    <div className="grid flex-1 gap-2">
                                        <Label
                                            htmlFor="role"
                                            className="text-muted-foreground"
                                        >
                                            Role
                                        </Label>
                                        <div className="relative">
                                            <Select
                                                value={data.role_id}
                                                onValueChange={(val) =>
                                                    setData('role_id', val)
                                                }
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.role_id
                                                            ? 'border-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={role.id.toString()}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.role_id && (
                                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                    {errors.role_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid flex-1 gap-2">
                                        <Label
                                            htmlFor="barangay"
                                            className="text-muted-foreground"
                                        >
                                            Assigned Barangay
                                        </Label>
                                        <div className="relative">
                                            <Select
                                                value={data.barangay}
                                                onValueChange={(val) => {
                                                    setData('barangay', val);
                                                    setData(
                                                        'assigned_brgy',
                                                        val,
                                                    );
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors.barangay
                                                            ? 'border-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue placeholder="Select barangay" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {barangays?.map((brgy) => (
                                                        <SelectItem
                                                            key={brgy}
                                                            value={brgy}
                                                        >
                                                            {brgy}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.barangay && (
                                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                                    {errors.barangay}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Status */}
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Status
                                </p>
                                <div className="relative">
                                    <Select
                                        value={data.status}
                                        onValueChange={(val) =>
                                            setData('status', val)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.status
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions?.map((status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                            {errors.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="px-4">
                        <div className="flex w-full flex-row justify-end gap-2">
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-sheet-close
                                >
                                    <MoveLeft className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default EditUser;
