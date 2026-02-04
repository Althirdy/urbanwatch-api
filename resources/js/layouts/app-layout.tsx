import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { useOperatorRealtime } from '@/hooks/use-operator-realtime';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { auth } = usePage<SharedData>().props;
    const isOperator = auth.user?.role_id === 1;

    // Initialize real-time listeners for operators
    useOperatorRealtime(isOperator);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster />
        </AppLayoutTemplate>
    );
};
