// Simple date formatting without date-fns
export const formatDistanceToNow = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return past.toLocaleDateString();
};

export const format = (date, formatStr) => {
    const d = new Date(date);

    if (formatStr === 'h:mm a') {
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    if (formatStr === 'MMM d, yyyy') {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    return d.toLocaleString();
};