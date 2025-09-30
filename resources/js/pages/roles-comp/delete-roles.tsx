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
import { roles_T } from '@/types/role-types';
import { useForm } from '@inertiajs/react';
import { Archive } from 'lucide-react';
import { useState } from 'react';

function DeleteRoles({ role }: { role: roles_T }) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirmText !== role.name) {
            return;
        }

        destroy(`/operator/roles/${role.id}`, {
            onSuccess: () => {
                setIsOpen(false);
                setConfirmText('');
            },
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer rounded-full p-2 hover:bg-destructive/20">
                    <Archive size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-bold text-destructive">
                        Archive Role
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this role?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2 pl-4">
                        <div>
                            <h1 className="font-bold">{role.name}</h1>
                            <p className="text-sm opacity-90">
                                {role.users_count || 0} users
                            </p>
                        </div>
                        <p className="text-sm italic opacity-90">
                            {role.description || 'No description provided.'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="delete-role">
                            To confirm, type{' '}
                            <span className="font-medium text-destructive">
                                {role.name}
                            </span>{' '}
                            below:
                        </Label>
                        <div className="relative">
                            <Input
                                id="delete-role"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className={
                                    confirmText && confirmText !== role.name
                                        ? 'border-red-500'
                                        : ''
                                }
                            />
                            {confirmText && confirmText !== role.name && (
                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                    Please type the exact role name to confirm
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setConfirmText('')}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={confirmText !== role.name || processing}
                        onClick={handleDelete}
                    >
                        {processing ? 'Archiving...' : 'Archive Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteRoles;
