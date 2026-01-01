// src/components/company/ProfileSection.jsx — MODERN MOBILE-FRIENDLY VERSION
import React from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useRef, useEffect } from 'react'
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
    ],
    "Beauty & Personal Care": [
        "Women's Hairstyling",
        "Men's Haircut",
        "Women's Haircut",
        "Kids Hair Styling",
        "Hair Braiding",
        "Hair Weaving",
        "Manicure",
        "Pedicure",
        "Nail Art",
        "Nail Extensions",
        "Lash Extensions",
        "Makeup Services",
        "Facial Treatment",
        "Other"
    ],
    "Cleaning Services": ["Other"],
    "Pest Control & Fumigation": ["Other"]
}

export default function ProfileSection({ company, editing, setEditing }) {
    const { supabase, user } = useSupabase()
    const profileFileInputRef = useRef(null)
    const portfolioFileInputRef = useRef(null)

    const [form, setForm] = useState({
        company_name: company?.company_name || '',
        address: company?.address || '',
        phone: company?.phone || '',
        bank_name: company?.bank_name || '',
        bank_account: company?.bank_account || ''
    })

    // Store selected main categories
    const [selectedCategories, setSelectedCategories] = useState(company?.services || [])

    // Store price ranges per subcategory
    const [subcategoryPrices, setSubcategoryPrices] = useState(company?.subcategory_prices || {})

    const [pictureKey, setPictureKey] = useState(Date.now())
    const [portfolioPictures, setPortfolioPictures] = useState(company?.portfolio_pictures || [])
    const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState([])
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
    const [activeServicesTab, setActiveServicesTab] = useState('main')
    const navigate = useNavigate();

    // Initialize portfolio pictures from company data
    useEffect(() => {
        if (company?.portfolio_pictures) {
            setPortfolioPictures(company.portfolio_pictures)
        }
    }, [company])

    const toggleCategory = (cat) => {
        const newSelected = selectedCategories.includes(cat)
            ? selectedCategories.filter(c => c !== cat)
            : [...selectedCategories, cat]

        setSelectedCategories(newSelected)

        // When unselecting a category, remove all its subcategory prices
        if (selectedCategories.includes(cat)) {
            const updatedPrices = { ...subcategoryPrices }
            servicesData[cat]?.forEach(sub => {
                delete updatedPrices[sub]
            })
            setSubcategoryPrices(updatedPrices)
        }
    }

    const handlePriceChange = (subcategory, field, value) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: {
                ...prev[subcategory],
                [field]: value,
                lastUpdated: new Date().toISOString()
            }
        }))
    }

    const handleTBD = (subcategory) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: {
                status: "TBD",
                lastUpdated: new Date().toISOString()
            }
        }))
    }

    const removeTBD = (subcategory) => {
        const updatedPrices = { ...subcategoryPrices }
        delete updatedPrices[subcategory]
        setSubcategoryPrices(updatedPrices)
    }

    const handlePortfolioFileChange = (e) => {
        const files = Array.from(e.target.files)

        if (portfolioPictures.length + files.length > 5) {
            alert(`Maximum 5 portfolio pictures. You have ${portfolioPictures.length}, trying to add ${files.length}.`)
            e.target.value = ''
            setSelectedPortfolioFiles([])
            return
        }

        setSelectedPortfolioFiles(files)
    }

    const handlePortfolioUpload = async () => {
        if (selectedPortfolioFiles.length === 0) return

        setUploadingPortfolio(true)
        const uploadedUrls = []

        try {
            for (const file of selectedPortfolioFiles) {
                const fileExt = file.name.split('.').pop()
                const timestamp = Date.now()
                const randomStr = Math.random().toString(36).substring(2, 8)
                const fileName = `${user.id}/portfolio/${timestamp}_${randomStr}.${fileExt}`

                const { error } = await supabase.storage
                    .from('company-portfolio')
                    .upload(fileName, file, { upsert: false })

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from('company-portfolio')
                    .getPublicUrl(fileName)

                uploadedUrls.push(publicUrl)
            }

            const newPortfolioPictures = [...portfolioPictures, ...uploadedUrls]
            setPortfolioPictures(newPortfolioPictures)
            setSelectedPortfolioFiles([])

            const { error } = await supabase
                .from('companies')
                .update({ portfolio_pictures: newPortfolioPictures })
                .eq('id', user.id)

            if (error) throw error

            alert(`✅ Uploaded ${selectedPortfolioFiles.length} picture(s)!`)
            if (portfolioFileInputRef.current) {
                portfolioFileInputRef.current.value = ''
            }

        } catch (error) {
            console.error('Upload error:', error)
            alert('Upload failed: ' + error.message)
        } finally {
            setUploadingPortfolio(false)
        }
    }

    const deletePortfolioPicture = async (pictureUrl) => {
        if (!confirm('Delete this portfolio picture?')) return

        try {
            const urlParts = pictureUrl.split('/')
            const fileName = urlParts[urlParts.length - 1]
            const fullPath = `${user.id}/portfolio/${fileName}`

            const { error: storageError } = await supabase.storage
                .from('company-portfolio')
                .remove([fullPath])

            if (storageError) console.warn('Storage delete warning:', storageError)

            const newPortfolioPictures = portfolioPictures.filter(url => url !== pictureUrl)
            setPortfolioPictures(newPortfolioPictures)

            const { error } = await supabase
                .from('companies')
                .update({ portfolio_pictures: newPortfolioPictures })
                .eq('id', user.id)

            if (error) throw error

            alert('✅ Picture deleted!')
        } catch (error) {
            console.error('Delete error:', error)
            alert('Delete failed: ' + error.message)
        }
    }

    const handleSave = async () => {
        // Validate required fields
        if (!form.company_name.trim()) {
            alert('Company name is required')
            return
        }

        if (selectedCategories.length === 0) {
            alert('Please select at least one service category')
            return
        }

        const updates = {
            company_name: form.company_name.trim(),
            address: form.address?.trim() || '',
            phone: form.phone?.trim() || '',
            bank_name: form.bank_name?.trim() || '',
            bank_account: form.bank_account?.trim() || '',
            services: selectedCategories,
            subcategory_prices: subcategoryPrices,
            portfolio_pictures: portfolioPictures
        }

        try {
            if (profileFileInputRef.current?.files[0]) {
                const file = profileFileInputRef.current.files[0]
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}/profile.${fileExt}`

                await supabase.storage.from('company-pictures').upload(fileName, file, { upsert: true })
                const { data: { publicUrl } } = supabase.storage.from('company-pictures').getPublicUrl(fileName)
                updates.picture_url = publicUrl
                setPictureKey(Date.now())
            }

            const { error } = await supabase
                .from('companies')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error

            alert('✅ Profile saved!')
            setEditing(false)
            setTimeout(() => window.location.reload(), 1000)

        } catch (error) {
            console.error('Save error:', error)
            alert('Save failed: ' + error.message)
        }
    }

    // Get only selected categories' subcategories
    const getSelectedSubcategories = () => {
        return selectedCategories.flatMap(cat =>
            servicesData[cat]?.map(sub => ({ category: cat, subcategory: sub })) || []
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
            {/* Profile Header - Mobile Optimized */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                    {/* Profile Picture */}
                    <div className="relative">
                        <img
                            key={pictureKey}
                            src={company?.picture_url ? `${company.picture_url}?t=${pictureKey}` : '/default-company.jpg'}
                            alt="Company"
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-naijaGreen shadow-lg"
                        />
                        {editing && (
                            <div className="mt-3 text-center">
                                <label className="block">
                                    <span className="text-sm bg-naijaGreen text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-darkGreen transition">
                                        Change Photo
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={profileFileInputRef}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-4xl font-bold text-naijaGreen mb-2 sm:mb-4">
                            {editing ? (
                                <input
                                    value={form.company_name}
                                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                                    placeholder="Company Name"
                                    className="w-full text-center sm:text-left text-2xl sm:text-4xl font-bold border-b-2 sm:border-b-4 border-naijaGreen outline-none bg-transparent px-2"
                                />
                            ) : company?.company_name}
                        </h2>

                        {company?.average_rating > 0 && (
                            <div className="inline-flex items-center bg-yellow-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-3">
                                <div className="flex items-center mr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            className={`w-4 h-4 sm:w-5 sm:h-5 ${star <= Math.round(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="font-bold text-gray-800 text-sm sm:text-base">
                                    {company.average_rating.toFixed(1)}
                                </span>
                                <span className="text-gray-600 ml-1 text-sm sm:text-base">
                                    ({company.total_reviews || 0} review{company.total_reviews !== 1 ? 's' : ''})
                                </span>
                            </div>
                        )}

                        <div className="mt-3">
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="bg-naijaGreen text-white px-6 py-3 sm:px-12 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-darkGreen transition shadow-lg w-full sm:w-auto"
                                >
                                    ✏️ Edit Profile
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleSave}
                                        className="bg-naijaGreen text-white px-6 py-3 rounded-full font-bold hover:bg-darkGreen transition flex-1"
                                    >
                                        💾 Save Changes
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-bold hover:bg-gray-300 transition flex-1"
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-naijaGreen mb-6">Company Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📍 Address</label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Business location"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📞 Phone</label>
                                <input
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Contact number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">🏦 Bank Name</label>
                                <input
                                    value={form.bank_name}
                                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                                    placeholder="Bank for payments"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">💳 Account Number</label>
                                <input
                                    value={form.bank_account}
                                    onChange={e => setForm({ ...form, bank_account: e.target.value })}
                                    placeholder="10-digit account"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services Selection - Tabbed Interface */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h3 className="text-xl sm:text-2xl font-bold text-naijaGreen">Services & Pricing</h3>

                            <div className="flex border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setActiveServicesTab('main')}
                                    className={`px-4 py-2 text-sm font-medium ${activeServicesTab === 'main' ? 'bg-naijaGreen text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Main Categories
                                </button>
                                <button
                                    onClick={() => setActiveServicesTab('sub')}
                                    className={`px-4 py-2 text-sm font-medium ${activeServicesTab === 'sub' ? 'bg-naijaGreen text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Set Prices ({getSelectedSubcategories().length})
                                </button>
                            </div>
                        </div>

                        {/* Main Categories Tab */}
                        {activeServicesTab === 'main' && (
                            <div>
                                <p className="text-gray-600 mb-4">Select the main services you offer:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.keys(servicesData).map(category => (
                                        <div key={category} className="relative">
                                            <input
                                                type="checkbox"
                                                id={`cat-${category}`}
                                                checked={selectedCategories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor={`cat-${category}`}
                                                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCategories.includes(category)
                                                    ? 'border-naijaGreen bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCategories.includes(category)
                                                        ? 'bg-naijaGreen border-naijaGreen'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {selectedCategories.includes(category) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{category}</span>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {servicesData[category].length} services available
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subcategories Pricing Tab */}
                        {activeServicesTab === 'sub' && (
                            <div>
                                {selectedCategories.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-4 text-gray-300">🔧</div>
                                        <p className="text-gray-600">Select main categories first to set prices</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {selectedCategories.map(category => (
                                            <div key={category} className="border border-gray-200 rounded-xl p-5">
                                                <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                                    <span className="bg-naijaGreen text-white px-3 py-1 rounded-full text-sm">
                                                        {category}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        ({servicesData[category].length} services)
                                                    </span>
                                                </h4>

                                                <div className="space-y-4">
                                                    {servicesData[category].map(sub => {
                                                        const priceData = subcategoryPrices[sub]
                                                        const isTBD = priceData?.status === "TBD"

                                                        return (
                                                            <div key={sub} className="bg-gray-50 rounded-lg p-4">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                                    <span className="font-medium text-gray-800">{sub}</span>

                                                                    {isTBD ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                                                                💭 TBD
                                                                            </span>
                                                                            <button
                                                                                onClick={() => removeTBD(sub)}
                                                                                className="text-sm text-gray-600 hover:text-red-600 underline"
                                                                            >
                                                                                Set Price
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            {priceData?.min && priceData?.max ? (
                                                                                <span className="text-sm font-medium text-green-600">
                                                                                    ₦{Number(priceData.min).toLocaleString()} - ₦{Number(priceData.max).toLocaleString()}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-sm text-gray-500">No price set</span>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleTBD(sub)}
                                                                                className="text-sm text-gray-600 hover:text-naijaGreen underline"
                                                                            >
                                                                                Mark as TBD
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {!isTBD && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs text-gray-600 mb-1">Min Price (₦)</label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="5000"
                                                                                value={priceData?.min || ''}
                                                                                onChange={e => handlePriceChange(sub, 'min', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-naijaGreen outline-none"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-600 mb-1">Max Price (₦)</label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="15000"
                                                                                value={priceData?.max || ''}
                                                                                onChange={e => handlePriceChange(sub, 'max', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-naijaGreen outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Portfolio Pictures Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-naijaGreen mb-6 flex items-center gap-2">
                            📸 Portfolio Pictures
                            <span className="text-sm font-normal text-gray-600">
                                (Max 5) • {portfolioPictures.length}/5 uploaded
                            </span>
                        </h3>

                        {/* Current Pictures */}
                        <div className="mb-6">
                            {portfolioPictures.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="text-4xl mb-3 text-gray-400">🖼️</div>
                                    <p className="text-gray-600 font-medium">No portfolio pictures yet</p>
                                    <p className="text-sm text-gray-500 mt-1">Show customers your best work</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {portfolioPictures.map((pictureUrl, index) => (
                                        <div key={index} className="relative group rounded-lg overflow-hidden">
                                            <img
                                                src={pictureUrl}
                                                alt={`Work ${index + 1}`}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    e.target.src = '/default-portfolio.jpg'
                                                    e.target.alt = 'Image failed to load'
                                                }}
                                            />
                                            <button
                                                onClick={() => deletePortfolioPicture(pictureUrl)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete"
                                            >
                                                ×
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                <p className="text-white text-xs">Work #{index + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload Section */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload New Pictures
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={portfolioFileInputRef}
                                        multiple
                                        onChange={handlePortfolioFileChange}
                                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-naijaGreen transition"
                                    />
                                </div>

                                {selectedPortfolioFiles.length > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <p className="font-medium text-blue-800 mb-2">
                                            Selected {selectedPortfolioFiles.length} file(s):
                                        </p>
                                        <ul className="space-y-1">
                                            {selectedPortfolioFiles.map((file, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm text-blue-700">
                                                    <span>📷</span>
                                                    <span className="truncate">{file.name}</span>
                                                    <span className="text-gray-600 text-xs">
                                                        ({(file.size / 1024).toFixed(0)} KB)
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => {
                                                setSelectedPortfolioFiles([])
                                                if (portfolioFileInputRef.current) {
                                                    portfolioFileInputRef.current.value = ''
                                                }
                                            }}
                                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                        >
                                            Clear selection
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        {5 - portfolioPictures.length} slots remaining
                                    </div>
                                    <button
                                        onClick={handlePortfolioUpload}
                                        disabled={uploadingPortfolio || selectedPortfolioFiles.length === 0}
                                        className="bg-naijaGreen text-white px-6 py-3 rounded-lg font-medium hover:bg-darkGreen disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                                    >
                                        {uploadingPortfolio ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            `Upload (${selectedPortfolioFiles.length})`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button (Bottom) */}
                    <div className="sticky bottom-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleSave}
                                className="bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition flex-1 text-lg"
                            >
                                💾 Save All Changes
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition flex-1"
                            >
                                ❌ Cancel Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}