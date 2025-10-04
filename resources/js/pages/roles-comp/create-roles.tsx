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
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React from 'react';

function CreateRoles() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/operator/roles', {
            onSuccess: () => {
                reset();
                // Find and click the close button
                const closeButton = document.querySelector(
                    '[data-sheet-close]',
                ) as HTMLButtonElement;
                if (closeButton) closeButton.click();
            },
            preserveScroll: true,
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>
                    <Plus /> Add Role
                </Button>
            </SheetTrigger>
            <SheetContent>
                <form onSubmit={onSubmit}>
                    <SheetHeader>
                        <SheetTitle>Create New Role</SheetTitle>
                        <SheetDescription>
                            Define a new role with its name and description.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-10 px-4 py-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Role Name</Label>
                            <div className="relative">
                                <Input
                                    id="name"
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
                                    <span className="left 0 absolute -bottom-5 text-xs text-red-500">
                                        {errors.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <div className="relative">
                                <Textarea
                                    id="description"
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
                            {processing ? 'Creating...' : 'Create Role'}
                        </Button>
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default CreateRoles;
