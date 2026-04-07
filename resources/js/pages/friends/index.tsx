import { Form, Head } from '@inertiajs/react';
import { Check, MailPlus, UserCheck, UserMinus, Users } from 'lucide-react';
import InputError from '@/components/input-error';
import SectionCard from '@/components/trips/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import friends from '@/routes/friends';
import friendships from '@/routes/friendships';

type Friend = {
    id: number;
    name: string;
    email: string;
};

type IncomingFriendRequest = {
    id: number;
    from_user_id: number;
    from_name: string | null;
    from_email: string | null;
};

type OutgoingFriendRequest = {
    id: number;
    to_user_id: number;
    to_name: string | null;
    to_email: string | null;
};

type FriendsPageProps = {
    acceptedFriends: Friend[];
    incomingFriendRequests: IncomingFriendRequest[];
    outgoingFriendRequests: OutgoingFriendRequest[];
};

export default function FriendsPage({
    acceptedFriends,
    incomingFriendRequests,
    outgoingFriendRequests,
}: FriendsPageProps) {
    return (
        <>
            <Head title="Friends" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-4">
                <section className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-100">Friends Hub</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">Manage your travel circle</h1>
                    <p className="mt-1 text-sm text-emerald-50/90">
                        Add friends, review incoming requests, and approve who can join your shared trips.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge className="bg-white/15 text-white">
                            <Users className="mr-1 h-3.5 w-3.5" />
                            {acceptedFriends.length} friends
                        </Badge>
                        <Badge className="bg-white/15 text-white">
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            {incomingFriendRequests.length} incoming
                        </Badge>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <SectionCard
                        title="Add Friend"
                        description="Send a friend request using their account email."
                        className="lg:col-span-1"
                    >
                        <Form action={friendships.store.url()} method="post" className="space-y-4">
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="friend-email">Friend email</Label>
                                        <Input
                                            id="friend-email"
                                            name="friend_email"
                                            type="email"
                                            placeholder="friend@example.com"
                                            required
                                        />
                                        <InputError message={errors.friend_email} />
                                    </div>
                                    <Button disabled={processing} className="w-full">
                                        <MailPlus className="mr-2 h-4 w-4" />
                                        Send Request
                                    </Button>
                                </>
                            )}
                        </Form>
                    </SectionCard>

                    <SectionCard
                        title="Incoming Requests"
                        description="Accept or reject requests waiting for your decision."
                        className="lg:col-span-2"
                    >
                        {incomingFriendRequests.length === 0 && (
                            <p className="text-sm text-muted-foreground">No incoming friend requests.</p>
                        )}
                        <div className="space-y-2">
                            {incomingFriendRequests.map((friendRequest) => (
                                <div key={friendRequest.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{friendRequest.from_name ?? 'User'}</p>
                                        <p className="text-xs text-muted-foreground">{friendRequest.from_email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Form action={friendships.accept.url({ friendship: friendRequest.id })} method="patch">
                                            {({ processing }) => (
                                                <Button disabled={processing} size="sm">
                                                    <Check className="mr-1 h-3.5 w-3.5" />
                                                    Accept
                                                </Button>
                                            )}
                                        </Form>
                                        <Form action={friendships.reject.url({ friendship: friendRequest.id })} method="delete">
                                            {({ processing }) => (
                                                <Button disabled={processing} variant="outline" size="sm">
                                                    <UserMinus className="mr-1 h-3.5 w-3.5" />
                                                    Reject
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard title="Friends List" description="Accepted friends available for trip invitations.">
                        {acceptedFriends.length === 0 && (
                            <p className="text-sm text-muted-foreground">No accepted friends yet.</p>
                        )}
                        <div className="space-y-2">
                            {acceptedFriends.map((friend) => (
                                <div key={friend.id} className="rounded-lg border p-3">
                                    <p className="font-medium">{friend.name}</p>
                                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Pending Sent" description="Requests you sent that are still awaiting response.">
                        {outgoingFriendRequests.length === 0 && (
                            <p className="text-sm text-muted-foreground">No pending outgoing requests.</p>
                        )}
                        <div className="space-y-2">
                            {outgoingFriendRequests.map((friendRequest) => (
                                <div key={friendRequest.id} className="rounded-lg border p-3">
                                    <p className="font-medium">{friendRequest.to_name ?? 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{friendRequest.to_email}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </>
    );
}

FriendsPage.layout = {
    breadcrumbs: [
        {
            title: 'Friends',
            href: friends.index(),
        },
    ],
};
