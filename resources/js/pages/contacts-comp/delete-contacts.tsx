import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2 } from 'lucide-react'
import { useForm } from '@inertiajs/react'
import { toast } from "@/components/use-toast"

type Contact = {
    id: number;
    branch_unit_name: string;
    contact_person?: string;
    responder_type: string;
    location: string;
    primary_mobile: string;
    backup_mobile?: string;
    latitude?: number;
    longitude?: number;
    active: boolean;
};

interface DeleteContactsProps {
    contact: Contact;
}

export default function DeleteContacts({ contact }: DeleteContactsProps) {
    const [open, setOpen] = useState(false)
    const { delete: destroy, processing } = useForm()

    const handleDelete = () => {
        destroy(`/contacts/${contact.id}`, {
            onSuccess: () => {
                setOpen(false)
                toast({
                    title: "Success",
                    description: "Contact deleted successfully!",
                });
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: "An error occurred while deleting the contact.",
                    variant: "destructive",
                });
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Contact</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this contact? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        <p className="text-sm">
                            <span className="font-medium">Branch/Unit:</span> {contact.branch_unit_name}
                        </p>
                        {contact.contact_person && (
                            <p className="text-sm">
                                <span className="font-medium">Contact Person:</span> {contact.contact_person}
                            </p>
                        )}
                        <p className="text-sm">
                            <span className="font-medium">Type:</span> {contact.responder_type}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Location:</span> {contact.location}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Primary Mobile:</span> {contact.primary_mobile}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        {processing ? 'Deleting...' : 'Delete Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
