import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ExternalLink, MapPin, Phone, User, Building, Clock } from 'lucide-react';

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
    created_at?: string;
    updated_at?: string;
};

interface ViewContactsProps {
    contact: Contact;
}

export default function ViewContacts({ contact }: ViewContactsProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className='p-2 rounded-full hover:bg-secondary/20 cursor-pointer' >
                    <ExternalLink size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Contact Details
                    </DialogTitle>
                    <DialogDescription>
                        View contact information and details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Branch/Unit Name */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Branch/Unit Name</Label>
                        <p className="text-sm text-muted-foreground">{contact.branch_unit_name}</p>
                    </div>

                    {/* Contact Person */}
                    {contact.contact_person && (
                        <div className="space-y-1">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Contact Person
                            </Label>
                            <p className="text-sm text-muted-foreground">{contact.contact_person}</p>
                        </div>
                    )}

                    {/* Responder Type */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Responder Type</Label>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {contact.responder_type}
                        </span>
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location
                        </Label>
                        <p className="text-sm text-muted-foreground">{contact.location}</p>
                    </div>

                    {/* Contact Numbers */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Contact Numbers
                        </Label>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Primary:</span>
                                <span className="text-sm text-muted-foreground">{contact.primary_mobile}</span>
                            </div>
                            {contact.backup_mobile && (
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Backup:</span>
                                    <span className="text-sm text-muted-foreground">{contact.backup_mobile}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GPS Coordinates */}
                    {(contact.latitude && contact.longitude) && (
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">GPS Coordinates</Label>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div>Latitude: {contact.latitude}</div>
                                <div>Longitude: {contact.longitude}</div>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Status</Label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            contact.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {contact.active ? '● Active' : '○ Inactive'}
                        </span>
                    </div>

                    {/* Timestamps */}
                    {contact.created_at && (
                        <div className="space-y-1">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {new Date(contact.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}