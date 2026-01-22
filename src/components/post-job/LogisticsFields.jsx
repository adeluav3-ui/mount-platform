import React from 'react';

const LogisticsFields = ({ job, setJob }) => {
    const handleLogisticsTypeChange = (type) => {
        setJob({
            ...job,
            logistics_type: type,
            // Clear other fields when type changes
            logistics_contact_phone: '',
            logistics_other_address: ''
        });
    };

    const validatePhone = (phone) => {
        // Nigerian phone number validation: 11 digits starting with 0, or 13 digits starting with +234
        const nigerianPhoneRegex = /^(0[7-9][0-1]\d{8}|\+234[7-9][0-1]\d{8})$/;
        return nigerianPhoneRegex.test(phone.replace(/\s+/g, ''));
    };

    return (
        <div className="space-y-5 p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="font-bold text-naijaGreen text-lg">Logistics Details</h3>

            {/* Service Type */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Service Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleLogisticsTypeChange('pickup')}
                        className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${job.logistics_type === 'pickup' ? 'bg-naijaGreen text-white border-naijaGreen' : 'bg-white text-gray-700 border-gray-300 hover:border-naijaGreen'}`}
                    >
                        📦 Pickup
                        <div className="text-xs mt-1 opacity-80">
                            Package to be picked up
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleLogisticsTypeChange('delivery')}
                        className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${job.logistics_type === 'delivery' ? 'bg-naijaGreen text-white border-naijaGreen' : 'bg-white text-gray-700 border-gray-300 hover:border-naijaGreen'}`}
                    >
                        🚚 Delivery
                        <div className="text-xs mt-1 opacity-80">
                            Package to be delivered
                        </div>
                    </button>
                </div>
            </div>

            {/* Contact Phone */}
            {job.logistics_type && (
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {job.logistics_type === 'pickup' ? "Sender's Phone Number" : "Receiver's Phone Number"}
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={job.logistics_contact_phone}
                        onChange={(e) => setJob({ ...job, logistics_contact_phone: e.target.value })}
                        placeholder="e.g., 08012345678 or +2348012345678"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                    />
                    {job.logistics_contact_phone && !validatePhone(job.logistics_contact_phone) && (
                        <p className="text-red-500 text-xs mt-1">
                            Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {job.logistics_type === 'pickup'
                            ? "Phone number of the person we're picking up from"
                            : "Phone number of the person receiving the package"}
                    </p>
                </div>
            )}

            {/* Other Address */}
            {job.logistics_type && (
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {job.logistics_type === 'pickup' ? "Pickup Address" : "Delivery Address"}
                        <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={job.logistics_other_address}
                        onChange={(e) => setJob({ ...job, logistics_other_address: e.target.value })}
                        placeholder={job.logistics_type === 'pickup'
                            ? "Enter the full pickup address including house number, street, landmarks..."
                            : "Enter the full delivery address including house number, street, landmarks..."}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {job.logistics_type === 'pickup'
                            ? "Where should we pick up the package from?"
                            : "Where should we deliver the package to?"}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LogisticsFields;