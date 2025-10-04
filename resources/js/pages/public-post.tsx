import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { publicPosts } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { PublicPost_T } from '@/types/public-post-types';
import { Head } from '@inertiajs/react';
import { List, Table } from 'lucide-react';
import { useState } from 'react';

import PublicPostCard from './public-post-comp/public-post-card';
import PublicPostTab from './public-post-comp/public-post-tab';
import PublicPostsTable from './public-post-comp/public-post-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Public Posts',
        href: publicPosts().url,
    },
];

interface PublicPostPageProps {
    data: {
        data: PublicPost_T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function PublicPost({ data }: PublicPostPageProps) {
    const posts = data?.data || [];
    const [filteredPosts, setFilteredPosts] = useState<PublicPost_T[]>(posts);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Public Posts" />
            <div className="space-y-4 p-4">
                <Tabs defaultValue="table" className="w-full space-y-2">
                    <div className="flex flex-row gap-4">
                        <PublicPostTab
                            posts={posts}
                            setFilteredPosts={setFilteredPosts}
                        />
                        <TabsList className="h-12 w-24">
                            <TabsTrigger
                                value="table"
                                className="cursor-pointer"
                            >
                                <List className="h-8 w-8" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="cursor-pointer"
                            >
                                <Table className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="table" className="w-full">
                        <PublicPostsTable posts={filteredPosts} />
                    </TabsContent>
                    <TabsContent value="card" className="w-full">
                        <PublicPostCard posts={filteredPosts} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
