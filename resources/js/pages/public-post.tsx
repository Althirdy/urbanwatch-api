import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { publicPosts } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { PublicPost_T } from '@/types/public-post-types';
import { Head, router } from '@inertiajs/react';
import { LayoutGrid, Table } from 'lucide-react';
import { useState, useEffect } from 'react';

import PublicPostCard from './public-post-comp/public-post-card';
import CreatePublicPost from './public-post-comp/create-public-post-modal';
import PublicPostTab from './public-post-comp/public-post-tab';
import PublicPostsTable from './public-post-comp/public-post-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Barangay Updates',
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
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

    // Auto-refresh data every 30 seconds to check for scheduled posts that should now be published
    useEffect(() => {
        const hasScheduledPosts = posts.some(post => {
            if (!post.published_at) return false;
            const publishDate = new Date(post.published_at);
            return publishDate > new Date();
        });

        // Only set up polling if there are scheduled posts
        if (hasScheduledPosts) {
            const interval = setInterval(() => {
                router.reload({ only: ['data'] });
            }, 30000); // Refresh every 30 seconds

            return () => clearInterval(interval);
        }
    }, [posts]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Public Posts" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <CreatePublicPost />

                    {/* View Toggle */}

                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'card')}>
                        <TabsList className="h-10 p-1">
                            <TabsTrigger
                                value="table"
                                className="h-8 px-4 text-xs data-[state=active]:bg-background"
                            >
                                <Table className="h-4 w-4 mr-2" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="h-8 px-4 text-xs data-[state=active]:bg-background"
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Cards
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                </div>


                <PublicPostTab
                    posts={posts}
                    setFilteredPosts={setFilteredPosts}
                />



                {viewMode === 'table' ? (
                    <PublicPostsTable posts={filteredPosts} />
                ) : (
                    <PublicPostCard posts={filteredPosts} />

                )}
            </div>
        </AppLayout>
    );
}
