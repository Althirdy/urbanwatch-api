import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Camera, MapPin, Monitor, Activity, Wifi, Settings, Archive } from 'lucide-react'
import { useForm } from '@inertiajs/react'
import { toast } from "@/components/use-toast"
import { cctv_T } from '../type'

interface ArchiveCCTVProps {
    cctv: cctv_T
    onArchiveSuccess?: () => void
}

function ArchiveCCTV({ cctv, onArchiveSuccess }: ArchiveCCTVProps) {
    const [open, setOpen] = useState(false)
    const [confirmationText, setConfirmationText] = useState('')

    const { delete: deleteRequest, processing } = useForm()

    // Check if confirmation text matches device name
    const isConfirmationValid = confirmationText === cctv.device_name

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Activity className="h-3 w-3" />
            case 'inactive': return <Wifi className="h-3 w-3" />
            case 'maintenance': return <Settings className="h-3 w-3" />
            default: return null
        }
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'inactive': return 'bg-gray-100 text-gray-800'
            case 'maintenance': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleArchive = () => {
        if (!isConfirmationValid) return

        deleteRequest(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
                toast({
                    title: "CCTV Device Archived",
                    description: `${cctv.device_name} has been successfully archived.`,
                    variant: "default",
                })
                setOpen(false)
                setConfirmationText('')
                onArchiveSuccess?.()
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to archive CCTV device. Please try again.",
                    variant: "destructive",
                })
            },
        })
    }

    const handleClose = () => {
        setOpen(false)
        setConfirmationText('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className='p-2 rounded-full hover:bg-destructive/20 cursor-pointer' >
                    <Archive className='text-destructive' size={20} />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-900/20 rounded-lg">
                            <Trash2 className="h-5 w-5 text-red-400" />
                        </div>
                        <DialogTitle className="text-red-400 text-lg">
                            Archive CCTV Device
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-300">
                        Are you sure you want to archive this CCTV device? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Device Information Card */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-900/20 rounded-lg">
                            <Camera className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-lg">
                                {cctv.device_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                    {cctv.location?.barangay}
                                </span>
                            </div>
                        </div>
                        <Badge className={`gap-1 capitalize ${getStatusColor(cctv.status)}`}>
                            {getStatusIcon(cctv.status)}
                            {cctv.status}
                        </Badge>
                    </div>

                    {/* Location Details */}
                    <div className="text-sm space-y-1 pt-2 border-t border-gray-700">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Location:</span>
                            <span className="text-gray-300">{cctv.location?.location_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Barangay:</span>
                            <span className="text-gray-300">{cctv.location?.barangay}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Landmark:</span>
                            <span className="text-gray-300">{cctv.location?.landmark}</span>
                        </div>
                    </div>

                    {/* Device Specifications */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                        <div className="text-sm">
                            <span className="text-gray-400 block">Resolution:</span>
                            <span className="text-gray-300">{cctv.resolution || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-400 block">FPS:</span>
                            <span className="text-gray-300">{cctv.fps || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-400 block">Brand:</span>
                            <span className="text-gray-300">{cctv.brand || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-400 block">Model:</span>
                            <span className="text-gray-300">{cctv.model || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Camera Count (if available) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                        <Monitor className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-gray-400">
                            Active Streams: <span className="text-blue-400">1</span>
                        </span>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                        To confirm archival, type{' '}
                        <span className="text-red-400 font-semibold">{cctv.device_name}</span>{' '}
                        below:
                    </div>
                    <Input
                        placeholder="Enter device name to confirm"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-red-400"
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleArchive}
                        disabled={!isConfirmationValid || processing}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {processing ? 'Archiving...' : 'Archive Device'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ArchiveCCTV