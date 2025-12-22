import React from 'react';
import './VerificationBadge.css'; // We'll create this next

const VerificationBadge = ({ verificationLevel, showText = true, size = 'medium' }) => {
    const getBadgeDetails = () => {
        switch (verificationLevel) {
            case 'verified':
                return {
                    icon: '✅',
                    text: 'Verified Customer',
                    color: 'var(--success-color, #10B981)',
                    bgColor: 'var(--success-bg, #D1FAE5)'
                };
            case 'pending':
                return {
                    icon: '⏳',
                    text: 'Verification Pending',
                    color: 'var(--warning-color, #F59E0B)',
                    bgColor: 'var(--warning-bg, #FEF3C7)'
                };
            case 'rejected':
                return {
                    icon: '❌',
                    text: 'Verification Rejected',
                    color: 'var(--error-color, #EF4444)',
                    bgColor: 'var(--error-bg, #FEE2E2)'
                };
            default: // 'basic'
                return {
                    icon: '🔒',
                    text: 'Basic Account',
                    color: 'var(--gray-color, #6B7280)',
                    bgColor: 'var(--gray-bg, #F3F4F6)'
                };
        }
    };

    const badge = getBadgeDetails();
    const sizeClass = size === 'small' ? 'badge-small' : size === 'large' ? 'badge-large' : '';

    return (
        <div className={`verification-badge ${sizeClass}`} style={{ backgroundColor: badge.bgColor, color: badge.color }}>
            <span className="badge-icon">{badge.icon}</span>
            {showText && <span className="badge-text">{badge.text}</span>}
        </div>
    );
};

export default VerificationBadge;