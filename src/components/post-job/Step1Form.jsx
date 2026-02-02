// src/components/post-job/Step1Form.jsx — UPDATED (No subservice required for certain categories)
import React from 'react';
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useEffect } from 'react'
import LogisticsFields from './LogisticsFields';

const ogunLocations = [
    'Abeokuta', 'Sango-Ota', 'Ijebu-Ode', 'Sagamu',
    'Ota', 'Mowe-Ibafo', 'Ewekoro', 'Ilaro', 'Ifo', 'Owode', 'Odeda', 'Others'
]

export default function Step1Form({
    job,
    setJob,
    setCompanies,
    setStep,
    photoFilesRef,
    photoPreviews,
    setPhotoPreviews,
    handlePhotoSelect,
    handleDeletePhoto,
    openCropper,
    supabase,
    services = {}
}) {
    // Clean up object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            photoPreviews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    // Check if category has subservices
    const categoryHasSubservices = (category) => {
        const subservices = services[category] || []
        // Categories with empty array or only "Other" have no real subservices
        return subservices.length > 0 && !(subservices.length === 1 && subservices[0] === "Other")
    }

    const validateForm = () => {
        const errors = []

        if (!job.category) errors.push('Please select a service category')

        // ONLY require sub_service for categories that HAVE subservices
        if (categoryHasSubservices(job.category) && !job.sub_service) {
            errors.push('Please select a specific service')
        }

        // For "Other" subservice, require custom description
        if (job.sub_service === 'Other' && !job.custom_sub?.trim()) {
            errors.push('Please specify the custom service')
        }

        if (!job.location) errors.push('Please select your location')
        if (!job.exact_address?.trim()) {
            errors.push('Please enter your exact address')
        }
        if (job.exact_address?.trim().length < 10) {
            errors.push('Address should be at least 10 characters')
        }

        if (!job.description?.trim()) errors.push('Please describe the job')
        if (job.description?.trim().length < 10) {
            errors.push('Description should be at least 10 characters')
        }

        // NEW VALIDATION FOR LOGISTICS SERVICES
        if (job.category === 'Logistics Services') {
            if (!job.logistics_type) {
                errors.push('Please select logistics service type (Pickup or Delivery)')
            }

            if (!job.logistics_destination_type) {
                errors.push('Please select destination type (Within Ogun State or Outside Ogun State)')
            }

            if (job.logistics_destination_type === 'intrastate' && !job.logistics_destination_location) {
                errors.push('Please select destination area in Ogun State')
            }

            if (job.logistics_destination_type === 'interstate' && !job.logistics_interstate_state) {
                errors.push('Please select destination state')
            }

            if (!job.logistics_contact_phone?.trim()) {
                errors.push(`Please enter ${job.logistics_type === 'pickup' ? "sender's" : "receiver's"} phone number`)
            } else {
                // Validate Nigerian phone number
                const phoneRegex = /^(0[7-9][0-1]\d{8}|\+234[7-9][0-1]\d{8})$/;
                if (!phoneRegex.test(job.logistics_contact_phone.replace(/\s+/g, ''))) {
                    errors.push('Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)')
                }
            }

            if (!job.logistics_other_address?.trim()) {
                errors.push(`Please enter ${job.logistics_type === 'pickup' ? 'pickup' : 'delivery'} address`)
            }
            if (job.logistics_other_address?.trim().length < 10) {
                errors.push(`${job.logistics_type === 'pickup' ? 'Pickup' : 'Delivery'} address should be at least 10 characters`)
            }
        }

        return errors
    }

    const handleNext = async () => {
        // Validate form
        const errors = validateForm()
        if (errors.length > 0) {
            alert(errors.join('\n'))
            return
        }

        console.log('=== DEBUG: Searching for companies ===')
        console.log('Selected category:', job.category)
        console.log('Selected sub-service:', job.sub_service)
        console.log('Category has subservices?', categoryHasSubservices(job.category))
        console.log('Budget:', job.price || 'N/A') // Add this line

        const { data, error } = await supabase
            .from('companies')
            .select(`
        *,
        average_rating,
        total_reviews,
        subcategory_prices,
        phone,
        logistics_service_type,
        logistics_served_locations,
        logistics_interstate_states
    `)
            .eq('approved', true)

        if (error) {
            alert('Failed to load companies: ' + error.message)
            return
        }

        console.log('=== DEBUG: ALL COMPANIES FROM DATABASE ===')
        data.forEach((company, index) => {
            console.log(`Company ${index + 1}:`, {
                name: company.company_name,
                id: company.id,
                services: company.services,
                subcategory_prices: company.subcategory_prices
            })
        })

        // Create jobWithDefaults for filtering
        const jobWithDefaults = {
            ...job,
            price: job.price || 'N/A'
        };

        // SIMPLE FILTERING: Show companies that offer this main category
        // FILTERING: Show companies that offer this main category
        const matches = data.filter(c => {
            const offersCategory = c.services?.includes(jobWithDefaults.category) // Use jobWithDefaults
            if (!offersCategory) return false

            console.log(`Company ${c.company_name}: offers ${jobWithDefaults.category}?`, offersCategory)

            // 3. SPECIAL FILTERING FOR LOGISTICS SERVICES
            if (jobWithDefaults.category === 'Logistics Services') { // Use jobWithDefaults
                console.log(`[LOGISTICS FILTER] Checking ${c.company_name} for logistics...`);

                // SPECIAL CASE: Yharah logistics only serves Abeokuta
                if (c.company_name === 'Yharah logistics' || c.company_name === 'Yharah Logistics') {
                    console.log(`[LOGISTICS FILTER] This is Yharah - checking service area...`);

                    // Yharah only serves Abeokuta for intrastate
                    if (jobWithDefaults.logistics_destination_type === 'intrastate') { // Use jobWithDefaults
                        const destination = jobWithDefaults.logistics_destination_location; // Use jobWithDefaults
                        const servesAbeokuta = destination === 'Abeokuta';
                        console.log(`[LOGISTICS FILTER] Yharah serves ${destination}?`, servesAbeokuta);
                        return servesAbeokuta;
                    } else if (jobWithDefaults.logistics_destination_type === 'interstate') { // Use jobWithDefaults
                        // Yharah doesn't do interstate at all
                        console.log(`[LOGISTICS FILTER] Yharah doesn't do interstate`);
                        return false;
                    }
                    return false; // Fallback
                }

                // For ALL OTHER logistics companies: Show for ALL areas
                console.log(`[LOGISTICS FILTER] ${c.company_name} is not Yharah - showing for all areas`);
                return true;
            }
            // For non-logistics services, use original filtering
            return true
        })

        console.log('=== DEBUG: FILTERED COMPANIES ===')
        console.log('Total approved companies:', data.length)
        console.log('Matching companies:', matches.length)
        matches.forEach(company => {
            console.log('Match:', company.company_name)
        })

        if (matches.length === 0) {
            alert(`No companies found for "${jobWithDefaults.category}" service. Please try another category.`) // Use jobWithDefaults
            return
        }

        setCompanies(matches)
        setStep(2)
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6 border border-gray-100">
            <h2 className="text-3xl font-bold text-center text-naijaGreen">
                Tell Us What You Need
            </h2>

            <div className="space-y-5">
                {/* CATEGORY */}
                <div>
                    <label className="block text-sm font-medium mb-1">Service Category</label>
                    <select
                        value={job.category}
                        onChange={e => setJob({
                            ...job,
                            category: e.target.value,
                            sub_service: '',
                            custom_sub: ''
                        })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                    >
                        <option value="">Choose category</option>
                        {Object.keys(services).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* SUB-SERVICE (ONLY SHOW FOR CATEGORIES WITH SUBSERVICES) */}
                {job.category && categoryHasSubservices(job.category) && (
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {job.category} Type
                        </label>
                        <select
                            value={job.sub_service}
                            onChange={e => setJob({ ...job, sub_service: e.target.value, custom_sub: '' })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                        >
                            <option value="">Choose specific service</option>
                            {services[job.category].map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* CUSTOM SUB FOR "OTHER" */}
                {job.sub_service === 'Other' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Specify Other</label>
                        <input
                            value={job.custom_sub}
                            onChange={e => setJob({ ...job, custom_sub: e.target.value })}
                            placeholder="Describe the custom service..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                        />
                    </div>
                )}

                {/* LOCATION */}
                <div>
                    <label className="block text-sm font-medium mb-1">Your Area</label>
                    <select
                        value={job.location}
                        onChange={e => setJob({ ...job, location: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                    >
                        <option value="">Select area</option>
                        {ogunLocations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                {/* EXACT ADDRESS */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Your Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={job.exact_address}
                        onChange={e => setJob({ ...job, exact_address: e.target.value })}
                        placeholder="Enter your full address including house number, street name, landmarks, etc..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This helps service providers find you easily. Include landmarks if possible.
                    </p>
                </div>

                {/* LOGISTICS-SPECIFIC FIELDS - ONLY SHOW FOR LOGISTICS SERVICES */}
                {job.category === 'Logistics Services' && (
                    <LogisticsFields job={job} setJob={setJob} />
                )}

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-medium mb-1">Describe the Job</label>
                    <textarea
                        rows={4}
                        value={job.description}
                        onChange={e => setJob({ ...job, description: e.target.value })}
                        placeholder="Tell us exactly what you need in full details..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none resize-none"
                    />
                </div>

                {/* PRICE */}
                <div>
                    <label className="block text-sm font-medium mb-1">Your Budget (₦) <span className="text-gray-400">(optional)</span></label>
                    <input
                        type="number"
                        value={job.price}
                        onChange={e => setJob({ ...job, price: e.target.value })}
                        placeholder="35000"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen outline-none"
                        min="0"
                        step="100"
                    />
                </div>
                {/* PHOTO UPLOAD */}
                <div>
                    <label className="block text-sm font-medium mb-1">Add Photos (optional)</label>
                    <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 text-center hover:border-naijaGreen transition relative cursor-pointer">
                        <p className="text-sm text-gray-600 mb-1">Tap to upload</p>
                        <p className="text-xs text-gray-500">You can add several images</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => handlePhotoSelect(Array.from(e.target.files))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {photoPreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {photoPreviews.map((src, i) => (
                                <div key={i} className="relative group">
                                    <img
                                        src={src}
                                        alt={`Preview ${i + 1}`}
                                        className="h-24 w-24 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => handleDeletePhoto(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-2 py-1 hover:bg-red-600"
                                    >
                                        X
                                    </button>
                                    <button
                                        onClick={() => openCropper(i)}
                                        className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg hover:bg-opacity-80"
                                    >
                                        Crop
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-naijaGreen text-white font-semibold text-lg py-4 rounded-xl hover:bg-darkGreen transition"
                >
                    Find Verified Companies →
                </button>
            </div>
        </div>
    )
}