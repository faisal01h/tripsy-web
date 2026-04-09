import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Coins, Route, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login, register } from '@/routes';
import trips from '@/routes/trips';

const tripSnapshot = [
    {
        destination: 'Bali Weekend Escape',
        members: '5',
        total: '$1,280',
        estimate: '$256',
        liveNote: 'Auto-balancing meals, villas, and airport rides.',
    },
    {
        destination: 'Bangkok Exploration',
        members: '4',
        total: '$3,211',
        estimate: '$803',
        liveNote: 'Splitting tuk-tuks, street food, and transportation costs.',
    },
];

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, name } = usePage().props;
    const isAuthenticated = !!auth.user;
    const currentYear = new Date().getFullYear();
    const activeSnapshot = useRotatingSnapshot(tripSnapshot, 7000);
    const destination = useTypedText(activeSnapshot.destination, { startDelay: 150, stepMs: 55 });
    const members = useTypedText(activeSnapshot.members, { startDelay: 1300, stepMs: 160 });
    const total = useTypedText(activeSnapshot.total, { startDelay: 1550, stepMs: 85 });
    const estimate = useTypedText(activeSnapshot.estimate, { startDelay: 1850, stepMs: 90 });
    const liveNote = useTypedText(activeSnapshot.liveNote, { startDelay: 2200, stepMs: 28 });

    return (
        <>
            <Head title={name}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-neutral-50 text-neutral-900">
                <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-cyan-600" />
                            <p className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">
                                {name}
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

                    <main className="flex-1 pt-14 sm:pt-20">
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
                                        <TypingText
                                            text={destination.displayedText}
                                            isComplete={destination.isComplete}
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                                            <p className="text-sm font-medium text-neutral-500">Members</p>
                                            <TypingText
                                                text={members.displayedText}
                                                isComplete={members.isComplete}
                                                className="mt-1 text-xl font-bold"
                                            />
                                        </div>
                                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                                            <p className="text-sm font-medium text-neutral-500">Total</p>
                                            <TypingText
                                                text={total.displayedText}
                                                isComplete={total.isComplete}
                                                className="mt-1 text-xl font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-900">
                                        <p className="text-sm font-medium">Per person estimate</p>
                                        <TypingText
                                            text={estimate.displayedText}
                                            isComplete={estimate.isComplete}
                                            className="mt-1 text-xl font-bold"
                                        />
                                    </div>
                                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/80 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                                            Live note
                                        </p>
                                        <TypingText
                                            text={liveNote.displayedText}
                                            isComplete={liveNote.isComplete}
                                            className="mt-2 text-sm leading-relaxed text-neutral-700"
                                        />
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

                    <footer className="mt-16 border-t border-neutral-200 py-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight text-neutral-900">
                                    {name}
                                </p>
                                <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
                                    Build a shared itinerary, capture every group expense, and keep settlement clear
                                    before the trip gets messy.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-neutral-600">
                                <Link
                                    href={isAuthenticated ? dashboard() : login()}
                                    className="rounded-md px-3 py-2 transition hover:bg-white hover:text-neutral-900"
                                >
                                    {isAuthenticated ? 'Dashboard' : 'Log in'}
                                </Link>
                                <Link
                                    href={isAuthenticated ? trips.index() : register()}
                                    className="rounded-md px-3 py-2 transition hover:bg-white hover:text-neutral-900"
                                >
                                    {isAuthenticated ? 'Trips' : 'Create account'}
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                            <p>{currentYear} {name}. Built for group travel without spreadsheet debt.</p>
                            <p>Friends, plans, balances, and multi-currency costs in one place.</p>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}

function TypingText({
    text,
    isComplete,
    className,
}: {
    text: string;
    isComplete: boolean;
    className?: string;
}) {
    return (
        <p className={className}>
            {text || '\u00A0'}
            {!isComplete && <span className="ml-0.5 inline-block w-2 animate-pulse">|</span>}
        </p>
    );
}

function useTypedText(
    text: string,
    { startDelay = 0, stepMs = 80 }: { startDelay?: number; stepMs?: number } = {},
) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [displayedText, setDisplayedText] = useState(() => (prefersReducedMotion ? text : ''));
    const [isComplete, setIsComplete] = useState(prefersReducedMotion);

    useEffect(() => {
        if (prefersReducedMotion) {
            return;
        }

        let currentIndex = 0;
        let typingTimer: number | undefined;
        const resetFrame = window.requestAnimationFrame(() => {
            setDisplayedText('');
            setIsComplete(false);
        });

        const startTimer = window.setTimeout(() => {
            typingTimer = window.setInterval(() => {
                currentIndex += 1;

                setDisplayedText(text.slice(0, currentIndex));

                if (currentIndex >= text.length) {
                    window.clearInterval(typingTimer);
                    setIsComplete(true);
                }
            }, stepMs);
        }, startDelay);

        return () => {
            window.cancelAnimationFrame(resetFrame);
            window.clearTimeout(startTimer);

            if (typingTimer !== undefined) {
                window.clearInterval(typingTimer);
            }
        };
    }, [prefersReducedMotion, startDelay, stepMs, text]);

    return { displayedText, isComplete };
}

function useRotatingSnapshot<T>(items: T[], cycleMs: number): T {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1 || prefersReducedMotion) {
            return;
        }

        const interval = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % items.length);
        }, cycleMs);

        return () => {
            window.clearInterval(interval);
        };
    }, [cycleMs, items.length, prefersReducedMotion]);

    return items[activeIndex] ?? items[0];
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return prefersReducedMotion;
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
