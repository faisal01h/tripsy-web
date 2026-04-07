import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Coins, Route, Users } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import trips from '@/routes/trips';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const isAuthenticated = !!auth.user;

    return (
        <>
            <Head title="Tripsy">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-neutral-50 text-neutral-900">
                <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-cyan-600" />
                            <p className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">
                                Tripsy
                            </p>
                        </div>

                        <nav className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href={dashboard()}
                                        className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={trips.index()}
                                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                    >
                                        Open Trips
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="pt-14 sm:pt-20">
                        <section className="grid gap-8 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700">
                                    Built for group travel
                                </p>
                                <h1 className="mt-5 max-w-xl font-['Space_Grotesk'] text-4xl font-bold tracking-tight sm:text-5xl">
                                    Plan your trip and split costs without the spreadsheet.
                                </h1>
                                <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">
                                    Tripsy helps your group create itineraries, track shared expenses, and settle balances
                                    clearly even when each expense uses different currencies.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={isAuthenticated ? trips.index() : login()}
                                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                    >
                                        {isAuthenticated ? 'Go to Trips' : 'Start now'}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    {!isAuthenticated && canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                                        >
                                            Create free account
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                                    Trip Snapshot
                                </p>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                                        <p className="text-sm font-medium text-neutral-500">Destination</p>
                                        <p className="mt-1 font-semibold">Bali Weekend Escape</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                                            <p className="text-sm font-medium text-neutral-500">Members</p>
                                            <p className="mt-1 text-xl font-bold">5</p>
                                        </div>
                                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                                            <p className="text-sm font-medium text-neutral-500">Total</p>
                                            <p className="mt-1 text-xl font-bold">$1,280</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-900">
                                        <p className="text-sm font-medium">Per person estimate</p>
                                        <p className="mt-1 text-xl font-bold">$256</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <FeatureCard
                                icon={Users}
                                title="Friends Only"
                                description="Add only accepted friends to each trip for better control."
                            />
                            <FeatureCard
                                icon={Route}
                                title="Shared Itinerary"
                                description="Keep everyone aligned with one timeline of plans."
                            />
                            <FeatureCard
                                icon={Coins}
                                title="Smart Expense Split"
                                description="Split to all members by default or only selected participants."
                            />
                            <FeatureCard
                                icon={BadgeCheck}
                                title="Host Permissions"
                                description="Hosts manage membership, defaults, and trip-level controls."
                            />
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Users;
    title: string;
    description: string;
}) {
    return (
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
        </article>
    );
}
