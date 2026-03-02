import { useEffect, useState } from 'react';
import echo from '@/lib/echo';
import { router } from '@inertiajs/react';
import { useToast } from '@/components';

interface AccidentData {
    id: number;
    title: string;
    description: string;
    accident_type?: string;
    accidentType?: string;
    latitude: string;
    longitude: string;
    status: string;
    severity: string;
    media: string[]; // Array of image URLs
}

export function useAccidentRealtime() {
    const [isConnected, setIsConnected] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Listen to accidents channel
        const channel = echo.channel('accidents');

        channel
            .listen('.accident.detected', (data: AccidentData) => {
                console.log('🚨 New accident detected!', data);

                // Show toast notification
                toast({
                    title: '🚨 New Accident Detected!',
                    description: `${data.title} - ${data.description}`,
                    variant: 'destructive',
                });

                // Refresh the page data
                router.reload({ only: ['reports'] });
            })
            .listen('.accident.updated', (data: AccidentData) => {
                console.log('🔄 Accident updated!', data);

                // Show toast notification for update
                toast({
                    title: '🔄 Accident Update',
                    description: `New snapshot added for #${data.id}`,
                    variant: 'default', // Less urgent than new accident
                });

                // Refresh the page data
                router.reload({ only: ['reports'] });
            })
            .subscribed(() => {
                setIsConnected(true);
            })
            .error((error: any) => {
                console.error('❌ Reverb connection error:', error);
                setIsConnected(false);
            });

        // Cleanup on unmount
        return () => {
            echo.leaveChannel('accidents');
        };
    }, [toast]);

    return { isConnected };
}
