import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { MoveLeft, Dot, Key } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ResetPinModal } from '@/components/ResetPinModal';
import { usePage } from '@inertiajs/react';

import { useIdentifyNumber } from '@/hooks/use-identify-number';
import { baseBadgeClasses, getStatusColorClass } from '@/lib/badgeStyles';
import { AvailablePunishmentsData, users_T } from '@/types/user-types';
import { cn } from '@/lib/utils';

// Leaflet marker icon
const markerIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Network provider color configurations
const networkColors: Record<
    string,
    { bg: string; text: string; border: string }
> = {
    Globe: {
        bg: 'bg-[#23308F]',
        text: ' text-foreground',
        border: 'border-[#23308F]',
    },
    Smart: {
        bg: 'bg-[#099343]',
        text: ' text-foreground',
        border: 'border-[#099343]',
    },
    TNT: {
        bg: 'bg-[#FD9D22]',
        text: 'text-[#D7E600]',
        border: 'border-[#D7E600]',
    },
    'Sun Cellular': {
        bg: 'bg-[#FDB810]',
        text: 'text-[#ED2C2B]',
        border: 'border-[#FDB810]',
    },
    DITO: {
        bg: 'bg-[#CD1025]',
        text: ' text-foreground',
        border: 'border-[#CD1025]',
    },
    Unknown: {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-muted',
    },
};

type ViewUserProps = {
    user: users_T;
    children: React.ReactNode;
};

function ViewUser({ user, children }: ViewUserProps) {
    const [suspensionData, setSuspensionData] =
        useState<AvailablePunishmentsData | null>(null);
    const [loadingSuspension, setLoadingSuspension] = useState(true);
    const [showResetPinModal, setShowResetPinModal] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { flash } = usePage().props as any;

    useEffect(() => {
        // Only fetch suspension data for Citizens (role_id = 3)
        // Purok Leaders (role_id = 2) don't have suspension data
        if (user.role_id === 3) {
            fetchSuspensionData();
        } else {
            setLoadingSuspension(false);
        }
    }, [user.id, user.role_id]);

    // Handle PIN reset from flash messages - close reset modal on success
    useEffect(() => {
        if (flash?.reset_pin && flash?.reset_purok_leader_name) {
            setShowResetPinModal(false); // Close the reset modal (PIN display handled by parent)
        }
    }, [flash]);

    const fetchSuspensionData = async () => {
        try {
            setLoadingSuspension(true);
            const response = await fetch(
                `/user/${user.id}/available-punishments`,
            );
            const result = await response.json();
            setSuspensionData(result);
        } catch (error) {
            console.error('Failed to fetch suspension data:', error);
        } finally {
            setLoadingSuspension(false);
        }
    };

    const formatFullPunishmentType = (type: string): string => {
        const formats: Record<string, string> = {
            warning_1: 'Warning 1 - 3 days',
            warning_2: 'Warning 2 - 7 days',
            suspension: 'Permanent Suspension',
        };
        return formats[type] || type;
    };

    // Function to generate initials from user's name
    const getInitials = (user: users_T) => {
        let firstName = '';
        let lastName = '';

        if (user.official_details) {
            firstName = user.official_details.first_name;
            lastName = user.official_details.last_name;
        } else if (user.citizen_details) {
            firstName = user.citizen_details.first_name;
            lastName = user.citizen_details.last_name;
        } else {
            // Fallback to name splitting
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts[nameParts.length - 1] || '';
        }

        const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial;
    };

    const getUserFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
        } else if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
        }
        return user.name;
    };

    const getUserPhoneNumber = (user: users_T) => {
        if (user.official_details) {
            return user.official_details.contact_number || 'N/A';
        } else if (user.citizen_details) {
            return user.citizen_details.phone_number || 'N/A';
        }
        return 'N/A';
    };

    const phoneNumberInfo = useIdentifyNumber(getUserPhoneNumber(user));

    const getUserStatus = (user: users_T) => {
        const status =
            user.citizen_details?.status ||
            user.official_details?.status ||
            'active';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const getUserCoordinates = (user: users_T) => {
        if (user.official_details?.latitude && user.official_details?.longitude) {
            return {
                lat: parseFloat(user.official_details.latitude),
                lng: parseFloat(user.official_details.longitude),
            };
        }
        return null;
    };

    const coordinates = getUserCoordinates(user);

    const isPurokLeader = user.role?.name?.toLowerCase() === 'purok leader';

    return (
        <>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent
                    className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                    showCloseButton={false}
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                            View detailed information about this user account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex w-full flex-1 flex-col justify-start gap-8 overflow-y-auto px-6 pb-6">
                        {/* Active Suspension Alert */}
                        {!loadingSuspension &&
                            suspensionData?.is_suspended &&
                            suspensionData.active_suspension && (
                                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Badge variant="destructive" className="text-[10px] font-medium px-1.5 py-0.5">
                                            Suspended
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Type:{' '}
                                        {formatFullPunishmentType(
                                            suspensionData.active_suspension.type,
                                        )}
                                        {suspensionData.active_suspension
                                            .expires_at && (
                                                <>
                                                    {' '}
                                                    • Expires:{' '}
                                                    {new Date(
                                                        suspensionData.active_suspension.expires_at,
                                                    ).toLocaleDateString()}
                                                </>
                                            )}
                                    </p>
                                    {suspensionData.active_suspension.reason && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Reason:{' '}
                                            {
                                                suspensionData.active_suspension
                                                    .reason
                                            }
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* Basic Information */}
                        <div className="flex flex-row items-center gap-2">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                                    {getInitials(user)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex w-full flex-row justify-between">
                                <div className="text-left">
                                    <h3 className="text-xl font-semibold">
                                        {getUserFullName(user)}
                                    </h3>
                                    <div className='flex gap-1 justify-start items-center'>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                        <Dot className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        <p className="text-sm text-muted-foreground">
                                            {user.role
                                                ? user.role.name
                                                : 'N/A'}
                                        </p>
                                    </div>


                                </div>

                                {user.role?.name?.toLowerCase() !== 'citizen' && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            baseBadgeClasses,
                                            getStatusColorClass(getUserStatus(user))
                                        )}
                                    >
                                        {getUserStatus(user)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {/* Contact Information & Role */}
                        <div className="flex w-full flex-col gap-4">
                            <div className="flex flex-col gap-2">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={user.email}
                                                readOnly
                                                tabIndex={-1}
                                                placeholder="Enter email address"
                                                className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact">
                                            Contact Number
                                        </Label>
                                        <div className="relative flex items-center gap-2">
                                            <Input
                                                id="contact"
                                                type="tel"
                                                value={getUserPhoneNumber(user)}
                                                readOnly
                                                tabIndex={-1}
                                                placeholder="Enter contact number"
                                                className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Coordinates Section - For Officials */}
                        {coordinates && (
                            <div className="flex w-full flex-col gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Location Coordinates
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <div className="relative">
                                            <Input
                                                id="latitude"
                                                type="text"
                                                value={coordinates.lat.toFixed(6)}
                                                readOnly
                                                tabIndex={-1}
                                                className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <div className="relative">
                                            <Input
                                                id="longitude"
                                                type="text"
                                                value={coordinates.lng.toFixed(6)}
                                                readOnly
                                                tabIndex={-1}
                                                className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Map Preview */}
                                <div className="mt-2">
                                    <Label className="mb-2 block">Map Location</Label>
                                    <div className="h-[200px] w-full rounded-md overflow-hidden border">
                                        <MapContainer
                                            center={[coordinates.lat, coordinates.lng]}
                                            zoom={16}
                                            style={{ height: '100%', width: '100%' }}
                                            zoomControl={true}
                                            dragging={true}
                                            scrollWheelZoom={false}
                                            doubleClickZoom={true}
                                            attributionControl={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[coordinates.lat, coordinates.lng]} icon={markerIcon} />
                                        </MapContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Address Section - For Citizens */}
                        {user.citizen_details && (
                            <div className="flex w-full flex-col gap-2">

                                <div className="grid gap-4">
                                    {user.citizen_details.address && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="street-address">Street Address</Label>
                                            <div className="relative">
                                                <Input
                                                    id="street-address"
                                                    type="text"
                                                    value={user.citizen_details.address}
                                                    readOnly
                                                    tabIndex={-1}
                                                    className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        {user.citizen_details.city && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="city">City</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="city"
                                                        type="text"
                                                        value={user.citizen_details.city}
                                                        readOnly
                                                        tabIndex={-1}
                                                        className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {user.citizen_details.province && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="province">Province</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="province"
                                                        type="text"
                                                        value={user.citizen_details.province}
                                                        readOnly
                                                        tabIndex={-1}
                                                        className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {user.citizen_details.postal_code && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="postal-code">Postal Code</Label>
                                            <div className="relative">
                                                <Input
                                                    id="postal-code"
                                                    type="text"
                                                    value={user.citizen_details.postal_code}
                                                    readOnly
                                                    tabIndex={-1}
                                                    className="border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-shrink-0 px-6 pb-4 gap-2">
                        {isPurokLeader && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDialogOpen(false);
                                    setShowResetPinModal(true);
                                }}
                                className="gap-2"
                            >
                                <Key className="h-4 w-4" />
                                Reset PIN
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button variant="outline">
                                <MoveLeft className="h-6 w-6" />
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset PIN Modal */}
            <ResetPinModal
                userId={user.id}
                userName={getUserFullName(user)}
                isOpen={showResetPinModal}
                onClose={() => setShowResetPinModal(false)}
                onSuccess={() => { }} // Success handled via flash in parent component
            />
        </>
    );
}

export default ViewUser;
