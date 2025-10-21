import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { roles_T } from '@/types/role-types';
import { useForm } from '@inertiajs/react';
import { SquarePen } from 'lucide-react';
import React, { useState } from 'react';

function EditRoles({ role }: { role: roles_T }) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        name: role.name,
        description: role.description || '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/operator/roles/${role.id}`, {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
            preserveScroll: true,
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className="cursor-pointer rounded-full p-2 hover:bg-secondary/20">
                    <SquarePen size={20} />
                </div>
            </SheetTrigger>
            <SheetContent>
                <form onSubmit={onSubmit}>
                    <SheetHeader>
                        <SheetTitle>Edit Role</SheetTitle>
                        <SheetDescription>
                            Edit role's name and description.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                        <div className="grid gap-3">
                            <Label htmlFor="edit-role-name">Role Name</Label>
                            <div className="relative">
                                <Input
                                    id="edit-role-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Enter role name"
                                    className={
                                        errors.name
                                            ? 'border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                />
                                {errors.name && (
                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                        {errors.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="edit-role-description">
                                Description
                            </Label>
                            <div className="relative">
                                <Textarea
                                    id="edit-role-description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Enter role description"
                                    className={
                                        'resize-none ' +
                                        (errors.description
                                            ? 'border-red-500 focus:ring-red-500'
                                            : '')
                                    }
                                />
                                {errors.description && (
                                    <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                        {errors.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="px-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <SheetClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setData({
                                        name: role.name,
                                        description: role.description || '',
                                    });
                                }}
                            >
                                Cancel
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default EditRoles;
