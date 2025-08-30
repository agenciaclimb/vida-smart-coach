import React, { useMemo } from 'react';

interface User {
    user_metadata?: {
        avatar_url?: string;
    };
}

interface TermsPageProps {
    user?: User | null;
}

/**
 * TermsPage renders the terms dashboard page.  The avatar image URL is derived
 * from the provided user object and memoized to avoid unnecessary recalculation
 * on subsequent renders when the source value has not changed.
 */
export default function TermsPage({ user }: TermsPageProps) {
    const avatarUrl = useMemo(() => {
        return user?.user_metadata?.avatar_url ?? '';
    }, [user?.user_metadata?.avatar_url]);

    return (
        <div>
            {avatarUrl && <img src={avatarUrl} alt="User avatar" />}
            {/* Page content goes here */}
        </div>
    );
}

