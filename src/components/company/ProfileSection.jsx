// src/components/company/ProfileSection.jsx — FINAL WITH SUBCATEGORY PRICING + TBD
import React from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';

const servicesData = {
    "Electrical": [
        "Light fixture installation and replacement",
        "Socket and switch repairs",
        "Circuit breaker fixes",
        "Ceiling fan installation",
        "Wiring faults and rewiring",
        "Inverter installation and troubleshooting",
        "Other"
    ],
    "Plumbing": [
        "Leaking taps and pipes",
        "Toilet repairs and replacements",
        "Water heater installation and servicing",
        "Drain unclogging",
        "Pump installation and repairs",
        "Shower and sink installation",
        "Other"
    ],
    "Carpentry / Woodwork": [
        "Door installation and alignment",
        "Cabinet repairs and custom builds",
        "Wardrobe installation",
        "Furniture repair",
        "Shelving and storage builds",
        "Other"
    ],
    "AC & Refrigeration": [
        "AC installation",
        "AC servicing",
        "Refrigeration repair",
        "Thermostat issues",
        "Other"
    ],
    "Painting & Finishing": [
        "Interior and exterior painting",
        "Wall repairs",
        "POP patching and finishing",
        "Other"
    ],
    "Home Appliances": [
        "Washing machine repair",
        "Gas cooker installation and repair",
        "Microwave repair",
        "TV mounting",
        "Other"
    ],
    "Security & Smart Home": [
        "CCTV installation",
        "Doorbell camera (smart bell) installation",
        "Smart lock installation",
        "Alarm system installation",
        "Other"
    ],
    "Roofing & Masonry": [
        "Roof leakage repair",
        "Tile installation and repairs",
        "Concrete patching",
        "Fence repair",
        "Other"
    ]
}

export default function ProfileSection({ company, editing, setEditing }) {
    const { supabase, user } = useSupabase()
    const fileInputRef = useRef(null)


    const [form, setForm] = useState({
        company_name: company?.company_name || '',
        address: company?.address || '',
        phone: company?.phone || '',
        bank_name: company?.bank_name || '',
        bank_account: company?.bank_account || ''
    })

    // Store selected main categories
    const [selectedCategories, setSelectedCategories] = useState(company?.services || [])

    // Store price ranges per subcategory: { "Inverter installation and troubleshooting": { min: "50000", max: "80000" } } or "TBD"
    const [subcategoryPrices, setSubcategoryPrices] = useState(company?.subcategory_prices || {})

    const [pictureKey, setPictureKey] = useState(Date.now())
    const navigate = useNavigate();

    const toggleCategory = (cat) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const handlePriceChange = (subcategory, field, value) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: { ...prev[subcategory], [field]: value }
        }))
    }

    const handleTBD = (subcategory) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: "TBD"
        }))
    }

    const handleSave = async () => {
        const updates = {
            company_name: form.company_name,
            address: form.address,
            phone: form.phone,
            bank_name: form.bank_name,
            bank_account: form.bank_account,
            services: selectedCategories,
            subcategory_prices: subcategoryPrices  // ← NEW FIELD
        }

        if (fileInputRef.current?.files[0]) {
            const file = fileInputRef.current.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/profile.${fileExt}`
            await supabase.storage.from('company-pictures').upload(fileName, file, { upsert: true })
            const { data: { publicUrl } } = supabase.storage.from('company-pictures').getPublicUrl(fileName)
            updates.picture_url = publicUrl
        }

        const { error } = await supabase.from('companies').update(updates).eq('id', user.id)

        if (!error) {
            setEditing(false)
            alert('Profile updated successfully!')
            window.location.reload()
        } else {
            alert('Error: ' + error.message)
        }
    }

    return (
        <>
            {/* Profile Picture */}
            <div className="text-center mb-10">
                <img
                    key={pictureKey}
                    src={company?.picture_url ? `${company.picture_url}?t=${pictureKey}` : '/default-company.jpg'}
                    alt="Company"
                    className="w-40 h-40 rounded-full mx-auto object-cover border-4 border-naijaGreen shadow-xl"
                />
                {editing && (
                    <div className="mt-4">
                        <input type="file" accept="image/*" ref={fileInputRef} className="block mx-auto" />
                        <p className="text-sm text-gray-600 mt-2">Upload new company picture</p>
                    </div>
                )}
            </div>

            {/* Rating Display */}
            {company.average_rating > 0 && (
                <div className="mt-4 inline-flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                    <div className="flex items-center mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <span className="font-bold text-gray-800">{company.average_rating.toFixed(1)}</span>
                    <span className="text-gray-600 ml-1">
                        ({company.total_reviews || 0} review{company.total_reviews !== 1 ? 's' : ''})
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            // Navigate to reviews page in SAME tab
                            navigate(`/company/${company.id}/reviews`);
                        }}
                        className="ml-3 text-sm text-naijaGreen hover:text-darkGreen underline"
                    >
                        View all reviews
                    </button>
                </div>
            )}

            {/* Company Name */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                <h2 className="text-4xl font-extrabold text-naijaGreen mb-6">
                    {editing ? (
                        <input
                            value={form.company_name}
                            onChange={e => setForm({ ...form, company_name: e.target.value })}
                            placeholder="Company Name"
                            className="text-center text-4xl font-bold w-full border-b-4 border-naijaGreen outline-none bg-transparent"
                        />
                    ) : company?.company_name}
                </h2>

                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="bg-naijaGreen text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-darkGreen transition shadow-xl"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-4 justify-center mt-8">
                        <button onClick={handleSave} className="bg-naijaGreen text-white px-12 py-5 rounded-full font-bold">
                            Save Changes
                        </button>
                        <button onClick={() => setEditing(false)} className="bg-red-600 text-white px-12 py-5 rounded-full font-bold">
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="mt-12 bg-white rounded-3xl shadow-2xl p-10 space-y-8">
                    <h3 className="text-2xl font-bold text-naijaGreen text-center mb-8">Edit Company Information</h3>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Company Address</label>
                        <input
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder="Enter business address"
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-naijaGreen outline-none text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Company Phone Number</label>
                        <input
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            placeholder="Enter phone number"
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-naijaGreen outline-none text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Bank Name</label>
                        <input
                            value={form.bank_name}
                            onChange={e => setForm({ ...form, bank_name: e.target.value })}
                            placeholder="Enter bank name"
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-naijaGreen outline-none text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Account Number</label>
                        <input
                            value={form.bank_account}
                            onChange={e => setForm({ ...form, bank_account: e.target.value })}
                            placeholder="Enter account number"
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-naijaGreen outline-none text-lg"
                        />
                    </div>

                    {/* NEW: SUBCATEGORY PRICING */}
                    <div className="bg-gray-50 rounded-2xl p-8">
                        <h4 className="text-xl font-bold text-naijaGreen mb-6">Services & Price Range (Per Subcategory)</h4>
                        <div className="space-y-8">
                            {Object.entries(servicesData).map(([category, subcategories]) => (
                                <div key={category} className="border-b pb-8 last:border-0">
                                    <div className="flex items-center gap-4 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className="w-6 h-6 accent-naijaGreen"
                                        />
                                        <label className="text-lg font-bold">{category}</label>
                                    </div>

                                    {selectedCategories.includes(category) && (
                                        <div className="ml-10 space-y-6">
                                            {subcategories.map(sub => (
                                                <div key={sub} className="bg-white p-5 rounded-xl border border-gray-200">
                                                    <p className="font-medium mb-3">{sub}</p>
                                                    {subcategoryPrices[sub] === "TBD" ? (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-naijaGreen font-bold">TBD (To Be Determined)</span>
                                                            <button
                                                                onClick={() => setSubcategoryPrices(prev => {
                                                                    const newPrices = { ...prev }
                                                                    delete newPrices[sub]
                                                                    return newPrices
                                                                })}
                                                                className="text-red-600 text-sm hover:underline"
                                                            >
                                                                Set Price Range
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-4">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Min Price"
                                                                    value={subcategoryPrices[sub]?.min || ''}
                                                                    onChange={e => handlePriceChange(sub, 'min', e.target.value)}
                                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    placeholder="Max Price"
                                                                    value={subcategoryPrices[sub]?.max || ''}
                                                                    onChange={e => handlePriceChange(sub, 'max', e.target.value)}
                                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleTBD(sub)}
                                                                className="text-sm text-gray-600 hover:text-naijaGreen underline"
                                                            >
                                                                Set as TBD (To Be Determined)
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}