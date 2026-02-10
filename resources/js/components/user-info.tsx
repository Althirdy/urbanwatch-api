import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const getFullName = (account: any) => {
        const officialFirst = account?.official_details?.first_name;
        const officialLast = account?.official_details?.last_name;
        if (officialFirst || officialLast) {
            return `${officialFirst ?? ''} ${officialLast ?? ''}`.trim();
        }

        const citizenFirst = account?.citizen_details?.first_name;
        const citizenLast = account?.citizen_details?.last_name;
        if (citizenFirst || citizenLast) {
            return `${citizenFirst ?? ''} ${citizenLast ?? ''}`.trim();
        }

        if (account?.name) {
            return String(account.name);
        }

        return String(account?.email ?? 'Unknown User');
    };

    const fullName = getFullName(user);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={fullName} />
                <AvatarFallback className="dark: rounded-lg bg-neutral-200 text-black text-foreground dark:bg-neutral-700">
                    {getInitials(fullName)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullName}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
