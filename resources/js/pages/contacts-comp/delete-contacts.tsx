import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Archive, Phone, MapPin, User } from 'lucide-react'
import { useForm } from '@inertiajs/react'
import { toast } from "@/components/use-toast"
import { Badge } from '@/components/ui/badge'

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
    const [isOpen, setIsOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const { delete: destroy, processing } = useForm()

    const handleDelete = () => {
        if (confirmText !== contact.branch_unit_name) {
            return;
        }

        destroy(`/contacts/${contact.id}`, {
            onSuccess: () => {
                setIsOpen(false)
                setConfirmText('')
                toast({
                    title: "Success",
                    description: "Contact archived successfully!",
                });
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: "An error occurred while archiving the contact.",
                    variant: "destructive",
                });
            },
            preserveScroll: true,
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className='p-2 rounded-full hover:bg-destructive/20 cursor-pointer' >
                    <Archive className='text-destructive' size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className='text-destructive font-bold flex items-center gap-2'>
                        <Archive className="h-5 w-5" />
                        Archive Contact
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this contact? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className='pl-4 space-y-3 border-l-4 border-destructive/20'>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <h1 className='font-bold text-lg'>{contact.branch_unit_name}</h1>
                                </div>
                                {contact.contact_person && (
                                    <p className='text-sm text-muted-foreground mb-2'>{contact.contact_person}</p>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {contact.responder_type}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="text-muted-foreground">Address:</span>
                                    <p className="font-medium">{contact.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="text-muted-foreground">Primary Mobile:</span>
                                    <p className="font-medium">{contact.primary_mobile}</p>
                                </div>
                            </div>
                            {contact.backup_mobile && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <span className="text-muted-foreground">Backup Mobile:</span>
                                        <p className="font-medium">{contact.backup_mobile}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {contact.latitude && contact.longitude && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Coordinates:</span>
                                <p className="font-mono text-xs bg-muted p-1 rounded mt-1">
                                    {contact.latitude}, {contact.longitude}
                                </p>
                            </div>
                        )}

                        <div className="text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                contact.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                ● {contact.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor='archive-contact'>
                            To confirm archiving, type <span className='text-destructive font-medium'>{contact.branch_unit_name}</span> below:
                        </Label>
                        <div className="relative">
                            <Input
                                id='archive-contact'
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Enter branch/unit name to confirm"
                                className={confirmText && confirmText !== contact.branch_unit_name ? 'border-red-500' : ''}
                            />
                            {confirmText && confirmText !== contact.branch_unit_name && (
                                <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                                    Please type the exact branch/unit name to confirm
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
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        variant='destructive'
                        disabled={confirmText !== contact.branch_unit_name || processing}
                        onClick={handleDelete}
                    >
                        {processing ? 'Archiving...' : 'Archive Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
