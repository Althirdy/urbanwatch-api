import { useEffect } from 'react';
import echo from '@/lib/echo';
import { router } from '@inertiajs/react';
import { useToast } from '@/components';

interface UnassignedConcern {
    id: number;
    title: string;
    category: string;
    tracking_code: string;
}

interface AccidentData {
    id: number;
    title: string;
    description: string;
    accident_type: string;
}

export function useOperatorRealtime(isOperator: boolean) {
    const { toast } = useToast();

    useEffect(() => {
        if (!isOperator) return;

        // 1. Listen to Operators Channel
        const operatorChannel = echo.private('operators');

        operatorChannel.listen('.concern.unassigned', (data: UnassignedConcern) => {
            console.log('📬 New Unassigned Concern Received:', data);

            toast({
                title: "📬 New Unassigned Concern",
                description: `${data.title} (#${data.tracking_code}) requires manual routing.`,
                variant: "default",
            });

            // Refresh current page if on dashboard
            if (window.location.pathname === '/dashboard') {
                router.reload({ only: ['unmappedConcerns'] });
            }
        });

        // 2. Listen to Accidents Channel (Global for Operators)
        const accidentsChannel = echo.channel('accidents');

        accidentsChannel.listen('.accident.detected', (data: AccidentData) => {
            console.log('🚨 New accident detected!', data);

            toast({
                title: '🚨 New Accident Detected!',
                description: `${data.title} - ${data.accident_type.toUpperCase()}`,
                variant: 'destructive',
            });

            // Refresh if on reports page
            if (window.location.pathname === '/reports') {
                router.reload({ only: ['reports'] });
            }
        });

        return () => {
            echo.leave('operators');
            echo.leaveChannel('accidents');
        };
    }, [isOperator, toast]);
}
