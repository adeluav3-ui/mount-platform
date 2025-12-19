// src/components/post-job/Step3Wait.jsx
import React from 'react';
export default function Step3Wait({ selectedCompany, tempSelectedCompany }) {
    const company = selectedCompany || tempSelectedCompany

    if (!company) return null

    return (
        <div className="mt-12 p-8 bg-white rounded-2xl shadow-lg text-center">
            <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-naijaGreen/20 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-naijaGreen mb-4">
                Job Sent to {company.company_name}!
            </h2>
            <p className="text-lg text-gray-700">
                Please wait 3–5 minutes while they review your job and set the exact price.
            </p>
            <p className="text-sm text-gray-500 mt-4">
                You will be notified when they respond.
            </p>
        </div>
    )
}