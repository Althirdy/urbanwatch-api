import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink } from 'lucide-react';

function ViewRoles() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className="rounded-full p-2 hover:bg-secondary/10">
                    <ExternalLink size={20} />
                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create New Role</SheetTitle>
                    <SheetDescription>
                        Define a new role with its name, description, and visual
                        appearance.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <div className="grid gap-3">
                        <Label htmlFor="role-name">Role</Label>
                        <Input
                            id="role-name"
                            defaultValue={'Operator'}
                            readOnly
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="role-description">Description</Label>
                        <Textarea
                            id="role-description"
                            className="resize-none"
                            defaultValue={
                                'Full access to monitor CCTV/IoT, manage users/devices, dispatch responders, and publish verified incidents.'
                            }
                            readOnly
                        />
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Return</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default ViewRoles;
