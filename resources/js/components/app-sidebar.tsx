import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    contacts,
    devices,
    publicPosts,
    reports,
    users,
} from '@/routes';
import { type NavItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BrainCircuit,
    File,
    FlagTriangleRight,
    Folder,
    LayoutDashboard,
    User,
    Users,
    Wrench,
} from 'lucide-react';
import AppLogo from './app-logo';

const operatorNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Users',
        href: users().url,
        icon: User,
    },
    {
        title: 'Incidents',
        href: reports().url,
        icon: File,
    },
    {
        title: 'Barangay Updates',
        href: publicPosts().url,
        icon: FlagTriangleRight,
    },
    {
        title: 'Devices',
        href: devices().url,
        icon: Folder,
    },
    {
        title: 'Contacts',
        href: contacts().url,
        icon: Users,
    },
];

const superadminNavItems: NavItem[] = [
    {
        title: 'Users',
        href: users().url,
        icon: User,
    },
    {
        title: 'AI Logs',
        href: '/ai-logs',
        icon: BrainCircuit,
    },
    {
        title: 'System Config',
        href: '/system-settings',
        icon: Wrench,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const roleName = String(auth.user?.role?.name ?? '').toLowerCase();
    const isSuperadmin = roleName === 'superadmin';
    const mainNavItems = isSuperadmin ? superadminNavItems : operatorNavItems;
    const navLabel = isSuperadmin ? 'Superadmin Panel' : 'Operator Dashboard';
    const homeHref = isSuperadmin ? users().url : '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset" className="py-4">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label={navLabel} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
