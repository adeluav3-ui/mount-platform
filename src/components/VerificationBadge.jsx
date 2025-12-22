import React from 'react';

const VerificationBadge = ({ verificationLevel, showText = true, size = 'medium', onClick }) => {
    const getBadgeDetails = () => {
        switch (verificationLevel) {
            case 'verified':
                return {
                    icon: '✅',
                    text: 'Verified Customer',
                    color: '#10B981',
                    bgColor: '#D1FAE5'
                };
            case 'pending':
                return {
                    icon: '⏳',
                    text: 'Verification Pending',
                    color: '#F59E0B',
                    bgColor: '#FEF3C7'
                };
            case 'rejected':
                return {
                    icon: '❌',
                    text: 'Verification Rejected',
                    color: '#EF4444',
                    bgColor: '#FEE2E2'
                };
            default: // 'basic'
                return {
                    icon: '🔒',
                    text: 'Basic Account',
                    color: '#6B7280',
                    bgColor: '#F3F4F6'
                };
        }
    };

    const badge = getBadgeDetails();

    // Size styles
    const sizeStyles = {
        small: {
            padding: '2px 8px',
            fontSize: '12px',
            iconSize: '12px',
            gap: '4px'
        },
        medium: {
            padding: '4px 10px',
            fontSize: '14px',
            iconSize: '14px',
            gap: '6px'
        },
        large: {
            padding: '6px 14px',
            fontSize: '16px',
            iconSize: '16px',
            gap: '8px'
        }
    };

    const currentSize = sizeStyles[size] || sizeStyles.medium;

    const badgeStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        padding: currentSize.padding,
        borderRadius: '20px',
        fontSize: currentSize.fontSize,
        fontWeight: '500',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        backgroundColor: badge.bgColor,
        color: badge.color,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default'
    };

    const iconStyle = {
        fontSize: currentSize.iconSize
    };

    const handleClick = () => {
        if (onClick && verificationLevel === 'basic') {
            onClick();
        }
    };

    return (
        <div
            className={`verification-badge ${onClick && verificationLevel === 'basic' ? 'clickable' : ''}`}
            style={badgeStyle}
            onClick={handleClick}
            title={verificationLevel === 'basic' ? 'Click to verify your account' : ''}
        >
            <span style={iconStyle}>{badge.icon}</span>
            {showText && <span className="badge-text">{badge.text}</span>}
        </div>
    );
};

export default VerificationBadge;