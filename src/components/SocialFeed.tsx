'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
// Optimized social performance


interface Post {
    id: string;
    userId: string;
    imageUrl: string;
    tokenAddress?: string;
    caption: string;
    likes: number;
    comments: Array<{
        id: string;
        userId: string;
        text: string;
        createdAt: string;
    }>;
    createdAt: string;
}

interface SocialFeedProps {
    onPostCreated?: (post: Post) => void;
}

export function SocialFeed({ onPostCreated }: SocialFeedProps) {
    const { address } = useAccount();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState({
        imageUrl: '',
        caption: '',
        tokenAddress: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await fetch('/api/tokens');
            const data = await response.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleCreatePost = async () => {
        if (!address || !newPost.imageUrl || !newPost.caption) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'post',
                    userId: address,
                    imageUrl: newPost.imageUrl,
                    tokenAddress: newPost.tokenAddress || undefined,
                    caption: newPost.caption,
                }),
            });

            const post = await response.json();
            setPosts([post, ...posts]);
            setNewPost({ imageUrl: '', caption: '', tokenAddress: '' });
            onPostCreated?.(post);
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId: string) => {
        // Mock like functionality - implement with real backend
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, likes: post.likes + 1 }
                : post
        ));
    };

    return (
        <div className="space-y-6">
            {/* Create Post Form */}
            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Create Post</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Image URL</label>
                        <input
                            type="url"
                            value={newPost.imageUrl}
                            onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Caption</label>
                        <textarea
                            value={newPost.caption}
                            onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                            rows={3}
                            placeholder="What's on your mind?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Token Address (Optional)</label>
                        <input
                            type="text"
                            value={newPost.tokenAddress}
                            onChange={(e) => setNewPost({ ...newPost, tokenAddress: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="0x..."
                        />
                    </div>

                    <Button
                        onClick={handleCreatePost}
                        disabled={isLoading || !address}
                        className="w-full"
                    >
                        {isLoading ? 'Creating...' : 'Create Post'}
                    </Button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {posts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">
                                {post.userId.slice(0, 6)}...{post.userId.slice(-4)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {post.imageUrl && (
                            <img
                                src={post.imageUrl}
                                alt="Post"
                                className="w-full max-w-md rounded-lg mb-2"
                            />
                        )}

                        <p className="mb-2">{post.caption}</p>

                        {post.tokenAddress && (
                            <p className="text-sm text-muted-foreground mb-2">
                                Token: {post.tokenAddress}
                            </p>
                        )}

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                            >
                                ❤️ {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm">
                                💬 {post.comments.length}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
