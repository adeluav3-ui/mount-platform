// src/components/company/ProfileSection.jsx — REFINED VERSION
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useNavigate } from 'react-router-dom'

const servicesData = {
    "Electrical": [
        "Light fixture installation and replacement",
        "Socket and switch repairs",
        "Circuit breaker fixes",
        "Ceiling fan installation",
        "Wiring faults and rewiring",
        "Solar and Inverter Installation and troubleshooting",
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
    "Cleaning Services": [],
    "Pest Control & Fumigation": [],
    "Logistics Services": []
}

export default function ProfileSection({ company, editing, setEditing }) {
    const { supabase, user } = useSupabase()
    const navigate = useNavigate()
    const profileFileInputRef = useRef(null)
    const portfolioFileInputRef = useRef(null)

    const [form, setForm] = useState({
        company_name: company?.company_name || '',
        address: company?.address || '',
        phone: company?.phone || '',
        bank_name: company?.bank_name || '',
        bank_account: company?.bank_account || '',
        // BUG FIX: account_name was missing from the form — this field is used in
        // JobsSection when sharing bank details with customers for onsite fees.
        // Without it, companies could never update their account_name via the UI.
        account_name: company?.account_name || '',
    })

    const [selectedCategories, setSelectedCategories] = useState(company?.services || [])
    const [subcategoryPrices, setSubcategoryPrices] = useState(company?.subcategory_prices || {})
    const [originalSubcategories, setOriginalSubcategories] = useState({})
    const [newSubcategories, setNewSubcategories] = useState({})
    const [newSubcategoryInputs, setNewSubcategoryInputs] = useState({})
    const [pictureKey, setPictureKey] = useState(Date.now())
    const [portfolioPictures, setPortfolioPictures] = useState(company?.portfolio_pictures || [])
    const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState([])
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activeServicesTab, setActiveServicesTab] = useState('main')
    const [showNewServiceDropdown, setShowNewServiceDropdown] = useState({})

    // ── Click outside to close dropdowns ─────────────────────────────────────
    // BUG FIX: Original had no click-outside handler, so dropdowns stayed open
    // indefinitely once opened. This closes them when clicking elsewhere.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown]')) {
                setShowNewServiceDropdown({})
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // ── Initialize original subcategories from company data ──────────────────
    useEffect(() => {
        if (company?.subcategory_prices) {
            const originalSubs = {}
            Object.keys(company.subcategory_prices).forEach(sub => {
                Object.entries(servicesData).forEach(([mainCat, subs]) => {
                    if (subs.includes(sub)) {
                        if (!originalSubs[mainCat]) originalSubs[mainCat] = []
                        if (!originalSubs[mainCat].includes(sub)) originalSubs[mainCat].push(sub)
                    }
                })
            })
            setOriginalSubcategories(originalSubs)
        }
    }, [company])

    useEffect(() => {
        if (company?.portfolio_pictures) setPortfolioPictures(company.portfolio_pictures)
    }, [company])

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isOriginalSubcategory = (mainCategory, subcategory) =>
        originalSubcategories[mainCategory]?.includes(subcategory) || false

    const isNewSubcategory = (mainCategory, subcategory) =>
        newSubcategories[mainCategory]?.includes(subcategory) || false

    const getDisplaySubcategories = (mainCategory) => [
        ...(originalSubcategories[mainCategory] || []),
        ...(newSubcategories[mainCategory] || [])
    ]

    const getAvailableServices = (category) => {
        const allServices = servicesData[category] || []
        const displaySubs = getDisplaySubcategories(category)
        return allServices.filter(service => !displaySubs.includes(service))
    }

    const toggleDropdown = (category) => {
        setShowNewServiceDropdown(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const addServiceFromDropdown = (category, service) => {
        if (getDisplaySubcategories(category).includes(service)) {
            alert(`"${service}" is already added for ${category}`)
            return
        }
        setNewSubcategories(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), service]
        }))
        handleTBD(service)
        setShowNewServiceDropdown(prev => ({ ...prev, [category]: false }))
    }

    const toggleCategory = (cat) => {
        const hasOriginalSubs = originalSubcategories[cat]?.length > 0
        if (hasOriginalSubs && selectedCategories.includes(cat)) {
            alert(`Cannot unselect "${cat}" because it has services you originally selected during signup.`)
            return
        }

        const isSelecting = !selectedCategories.includes(cat)
        const newSelected = isSelecting
            ? [...selectedCategories, cat]
            : selectedCategories.filter(c => c !== cat)
        setSelectedCategories(newSelected)

        if (isSelecting && (!servicesData[cat] || servicesData[cat].length === 0)) {
            setSubcategoryPrices(prev => ({
                ...prev,
                [cat]: { status: 'TBD', lastUpdated: new Date().toISOString(), autoAdded: true }
            }))
        }

        if (!isSelecting && !hasOriginalSubs) {
            const updatedPrices = { ...subcategoryPrices }
            if (!servicesData[cat] || servicesData[cat].length === 0) {
                delete updatedPrices[cat]
            } else {
                Object.keys(updatedPrices).forEach(sub => {
                    if (servicesData[cat]?.includes(sub)) delete updatedPrices[sub]
                })
            }
            setSubcategoryPrices(updatedPrices)
            setNewSubcategories(prev => { const n = { ...prev }; delete n[cat]; return n })
        }
    }

    const handlePriceChange = (subcategory, field, value) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: { ...prev[subcategory], [field]: value, lastUpdated: new Date().toISOString() }
        }))
    }

    const handleTBD = (subcategory) => {
        setSubcategoryPrices(prev => ({
            ...prev,
            [subcategory]: { status: 'TBD', lastUpdated: new Date().toISOString() }
        }))
    }

    const removeTBD = (subcategory) => {
        const updatedPrices = { ...subcategoryPrices }
        if (updatedPrices[subcategory]?.status === 'TBD') {
            delete updatedPrices[subcategory]
            setSubcategoryPrices(updatedPrices)
        }
    }

    const addNewSubcategory = (mainCategory, subcategoryName) => {
        if (!subcategoryName?.trim()) return
        const newSub = subcategoryName.trim()
        const existingSubs = [
            ...(originalSubcategories[mainCategory] || []),
            ...(newSubcategories[mainCategory] || [])
        ]
        if (existingSubs.includes(newSub)) {
            alert(`"${newSub}" already exists for ${mainCategory}`)
            return
        }
        setNewSubcategories(prev => ({
            ...prev,
            [mainCategory]: [...(prev[mainCategory] || []), newSub]
        }))
        handleTBD(newSub)
        setNewSubcategoryInputs(prev => ({ ...prev, [mainCategory]: '' }))
    }

    const removeNewSubcategory = (mainCategory, subcategory) => {
        if (!isNewSubcategory(mainCategory, subcategory)) return
        setNewSubcategories(prev => ({
            ...prev,
            [mainCategory]: prev[mainCategory]?.filter(s => s !== subcategory) || []
        }))
        const updatedPrices = { ...subcategoryPrices }
        delete updatedPrices[subcategory]
        setSubcategoryPrices(updatedPrices)
    }

    // ── Portfolio ─────────────────────────────────────────────────────────────
    const handlePortfolioFileChange = (e) => {
        const files = Array.from(e.target.files)
        if (portfolioPictures.length + files.length > 10) {
            alert(`Maximum 10 portfolio pictures. You have ${portfolioPictures.length}, trying to add ${files.length}.`)
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

            alert(`✅ Uploaded ${uploadedUrls.length} picture(s)!`)
            if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = ''
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
            // BUG FIX: Original split the full CDN URL and took only the last
            // segment (the filename), losing the `userId/portfolio/` path prefix.
            // This caused storage deletes to silently fail (wrong path).
            // Fix: extract the path after the bucket name in the URL.
            let storagePath = null
            try {
                const url = new URL(pictureUrl)
                // Supabase storage URLs look like:
                // .../storage/v1/object/public/company-portfolio/userId/portfolio/file.jpg
                const match = url.pathname.match(/\/company-portfolio\/(.+)$/)
                if (match) storagePath = match[1]
            } catch (e) {
                // Fallback: try to reconstruct from known pattern
                storagePath = `${user.id}/portfolio/${pictureUrl.split('/').pop()}`
            }

            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('company-portfolio')
                    .remove([storagePath])
                if (storageError) console.warn('Storage delete warning:', storageError)
            }

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

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.company_name.trim()) {
            alert('Company name is required')
            return
        }
        if (selectedCategories.length === 0) {
            alert('Please select at least one service category')
            return
        }

        // Ensure original categories are still selected
        let finalCategories = [...selectedCategories]
        Object.keys(originalSubcategories).forEach(cat => {
            if (originalSubcategories[cat]?.length > 0 && !finalCategories.includes(cat)) {
                finalCategories.push(cat)
            }
        })

        // Ensure categories without subservices have an entry in prices
        const finalSubcategoryPrices = { ...subcategoryPrices }
        finalCategories.forEach(cat => {
            if (!servicesData[cat] || servicesData[cat].length === 0) {
                if (!finalSubcategoryPrices[cat]) {
                    finalSubcategoryPrices[cat] = {
                        status: 'TBD',
                        lastUpdated: new Date().toISOString(),
                        autoAdded: true
                    }
                }
            }
        })

        setSaving(true)
        try {
            const updates = {
                company_name: form.company_name.trim(),
                address: form.address?.trim() || '',
                phone: form.phone?.trim() || '',
                bank_name: form.bank_name?.trim() || '',
                bank_account: form.bank_account?.trim() || '',
                account_name: form.account_name?.trim() || '', // BUG FIX: now saved
                services: finalCategories,
                subcategory_prices: finalSubcategoryPrices,
                portfolio_pictures: portfolioPictures,
                updated_at: new Date().toISOString()
            }

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
            // BUG FIX: Original did `setTimeout(() => window.location.reload(), 1000)`
            // which is a blunt full-page reload. Since we update local state via
            // setEditing(false), a reload isn't needed — the parent component should
            // refetch company data. If a reload is truly needed, it should be triggered
            // by the parent via a callback prop, not a timeout here.
        } catch (error) {
            console.error('Save error:', error)
            alert('Save failed: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-6">

            {/* ── Profile Header ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-5 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">

                    {/* Avatar */}
                    <div className="shrink-0 text-center">
                        <div className="relative inline-block">
                            <img
                                key={pictureKey}
                                src={company?.picture_url ? `${company.picture_url}?t=${pictureKey}` : '/default-company.jpg'}
                                alt="Company"
                                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-gray-200 shadow-sm"
                            />
                            {editing && (
                                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-naijaGreen text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-darkGreen transition shadow-lg" title="Change photo">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <input type="file" accept="image/*" ref={profileFileInputRef} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 text-center sm:text-left">
                        {editing ? (
                            <input
                                value={form.company_name}
                                onChange={e => setForm({ ...form, company_name: e.target.value })}
                                placeholder="Company Name"
                                className="w-full text-2xl sm:text-3xl font-bold border-b-2 border-naijaGreen outline-none bg-transparent text-naijaGreen pb-1 mb-3"
                            />
                        ) : (
                            <h2 className="text-2xl sm:text-3xl font-bold text-naijaGreen mb-2">
                                {company?.company_name}
                            </h2>
                        )}

                        {company?.average_rating > 0 && (
                            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full mb-3">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <svg key={star} className={`w-4 h-4 ${star <= Math.round(company.average_rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="font-bold text-gray-800 text-sm">{company.average_rating.toFixed(1)}</span>
                                <span className="text-gray-500 text-sm">({company.total_reviews || 0} review{company.total_reviews !== 1 ? 's' : ''})</span>
                            </div>
                        )}

                        <div className="mt-3">
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="bg-naijaGreen text-white px-6 py-2.5 rounded-xl font-bold hover:bg-darkGreen transition shadow-sm text-sm w-full sm:w-auto"
                                >
                                    ✏️ Edit Profile
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-naijaGreen text-white px-6 py-2.5 rounded-xl font-bold hover:bg-darkGreen transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                                        ) : '💾 Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Edit Form ── */}
            {editing && (
                <div className="space-y-5">

                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
                        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="w-7 h-7 bg-naijaGreen/10 rounded-lg flex items-center justify-center text-sm">🏢</span>
                            Company Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📍 Address</label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Business location"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/10 outline-none transition text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📞 Phone</label>
                                <input
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Contact number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/10 outline-none transition text-sm"
                                />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🏦 Bank Details (used for onsite fee payments)</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Bank Name</label>
                                    <input
                                        value={form.bank_name}
                                        onChange={e => setForm({ ...form, bank_name: e.target.value })}
                                        placeholder="e.g. GTBank"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/10 outline-none transition text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Account Number</label>
                                    <input
                                        value={form.bank_account}
                                        onChange={e => setForm({ ...form, bank_account: e.target.value })}
                                        placeholder="10-digit account"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/10 outline-none transition text-sm"
                                    />
                                </div>
                                {/* BUG FIX: account_name field was completely missing from the UI.
                                    JobsSection reads company.account_name when sharing bank details
                                    with customers. Without this field, it falls back to company_name
                                    which may differ from the actual account name at the bank. */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Account Name</label>
                                    <input
                                        value={form.account_name}
                                        onChange={e => setForm({ ...form, account_name: e.target.value })}
                                        placeholder="Name on bank account"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/10 outline-none transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services & Pricing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-7 h-7 bg-naijaGreen/10 rounded-lg flex items-center justify-center text-sm">🔧</span>
                                Services & Pricing
                            </h3>
                            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setActiveServicesTab('main')}
                                    className={`px-4 py-2 text-xs font-semibold transition ${activeServicesTab === 'main' ? 'bg-naijaGreen text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Categories
                                </button>
                                <button
                                    onClick={() => setActiveServicesTab('sub')}
                                    className={`px-4 py-2 text-xs font-semibold transition ${activeServicesTab === 'sub' ? 'bg-naijaGreen text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Prices ({Object.keys(subcategoryPrices).length})
                                </button>
                            </div>
                        </div>

                        {/* Main Categories Tab */}
                        {activeServicesTab === 'main' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Select the main services your company offers:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {Object.keys(servicesData).map(category => {
                                        const hasOriginalSubs = originalSubcategories[category]?.length > 0
                                        const isSelected = selectedCategories.includes(category)
                                        return (
                                            <label
                                                key={category}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                        ? 'border-naijaGreen bg-naijaGreen/5'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    } ${hasOriginalSubs && isSelected ? 'cursor-default' : ''}`}
                                                onClick={() => toggleCategory(category)}
                                            >
                                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isSelected ? 'bg-naijaGreen border-naijaGreen' : 'border-gray-300'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{category}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {servicesData[category].length > 0
                                                            ? `${servicesData[category].length} services`
                                                            : 'General service'}
                                                        {hasOriginalSubs && (
                                                            <span className="ml-1.5 text-blue-500">· {originalSubcategories[category]?.length} active</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {hasOriginalSubs && isSelected && (
                                                    <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Required</span>
                                                )}
                                            </label>
                                        )
                                    })}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-700">
                                        <strong>Note:</strong> Categories with existing services cannot be unselected. Add new services in the "Prices" tab.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Subcategories Pricing Tab */}
                        {activeServicesTab === 'sub' && (
                            <div>
                                {selectedCategories.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="text-3xl mb-3 text-gray-300">🔧</div>
                                        <p className="text-gray-500 text-sm">Select main categories first to set prices</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Categories WITH subcategories */}
                                        {selectedCategories
                                            .filter(cat => servicesData[cat] && servicesData[cat].length > 0)
                                            .map(category => {
                                                const displaySubs = getDisplaySubcategories(category)
                                                const hasOriginalSubs = originalSubcategories[category]?.length > 0
                                                const availableServices = getAvailableServices(category)

                                                return (
                                                    <div key={category} className="border border-gray-200 rounded-2xl overflow-hidden">
                                                        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-naijaGreen text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{category}</span>
                                                                <span className="text-xs text-gray-500">{displaySubs.length} service{displaySubs.length !== 1 ? 's' : ''}</span>
                                                                {hasOriginalSubs && (
                                                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{originalSubcategories[category]?.length} original</span>
                                                                )}
                                                            </div>
                                                            {/* BUG FIX: Add data-dropdown attr so click-outside handler knows
                                                                to not close this when clicking inside it */}
                                                            <div className="relative" data-dropdown>
                                                                {availableServices.length > 0 ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => toggleDropdown(category)}
                                                                            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                                                                        >
                                                                            + Add Service
                                                                            <svg className={`w-3 h-3 transition-transform ${showNewServiceDropdown[category] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </button>
                                                                        {showNewServiceDropdown[category] && (
                                                                            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 max-h-56 overflow-y-auto">
                                                                                <div className="p-1.5">
                                                                                    <p className="px-3 py-1.5 text-xs text-gray-400 font-medium border-b border-gray-100 mb-1">Available services:</p>
                                                                                    {availableServices.map(service => (
                                                                                        <button
                                                                                            key={service}
                                                                                            onClick={() => addServiceFromDropdown(category, service)}
                                                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                                                                                        >
                                                                                            <span className="text-naijaGreen font-bold text-xs">+</span>
                                                                                            <span className="truncate">{service}</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">All services added</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="p-4">
                                                            {displaySubs.length === 0 ? (
                                                                <div className="text-center py-6 text-sm text-gray-400">
                                                                    No services selected — click "Add Service" above
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {displaySubs.map(sub => {
                                                                        const priceData = subcategoryPrices[sub]
                                                                        const isTBD = priceData?.status === 'TBD'
                                                                        const isNew = isNewSubcategory(category, sub)
                                                                        const isOriginal = isOriginalSubcategory(category, sub)

                                                                        return (
                                                                            <div key={sub} className={`rounded-xl p-3.5 ${isNew ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
                                                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                        <span className="font-semibold text-gray-800 text-sm">{sub}</span>
                                                                                        {isNew && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">New</span>}
                                                                                        {isOriginal && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Original</span>}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                                        {isTBD ? (
                                                                                            <>
                                                                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">TBD</span>
                                                                                                <button onClick={() => removeTBD(sub)} className="text-xs text-blue-600 hover:underline">Set Price</button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                {priceData?.min && priceData?.max ? (
                                                                                                    <span className="text-xs font-semibold text-emerald-600">₦{Number(priceData.min).toLocaleString()} – ₦{Number(priceData.max).toLocaleString()}</span>
                                                                                                ) : (
                                                                                                    <span className="text-xs text-gray-400">No price</span>
                                                                                                )}
                                                                                                <button onClick={() => handleTBD(sub)} className="text-xs text-gray-500 hover:underline">TBD</button>
                                                                                            </>
                                                                                        )}
                                                                                        {isNew && (
                                                                                            <button onClick={() => removeNewSubcategory(category, sub)} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-1">× Remove</button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {!isTBD && (
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <div>
                                                                                            <label className="block text-xs text-gray-500 mb-1">Min Price (₦)</label>
                                                                                            <input
                                                                                                type="number"
                                                                                                placeholder="5000"
                                                                                                value={priceData?.min || ''}
                                                                                                onChange={e => handlePriceChange(sub, 'min', e.target.value)}
                                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-naijaGreen outline-none text-sm"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-xs text-gray-500 mb-1">Max Price (₦)</label>
                                                                                            <input
                                                                                                type="number"
                                                                                                placeholder="15000"
                                                                                                value={priceData?.max || ''}
                                                                                                onChange={e => handlePriceChange(sub, 'max', e.target.value)}
                                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-naijaGreen outline-none text-sm"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                        {/* Categories WITHOUT subcategories (e.g. Logistics) */}
                                        {selectedCategories
                                            .filter(cat => !servicesData[cat] || servicesData[cat].length === 0)
                                            .map(category => {
                                                const priceData = subcategoryPrices[category] || {}
                                                const isTBD = priceData?.status === 'TBD'

                                                return (
                                                    <div key={category} className="border-2 border-blue-200 rounded-2xl overflow-hidden">
                                                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-200">
                                                            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{category}</span>
                                                            <span className="text-xs text-blue-600">General Service</span>
                                                        </div>
                                                        <div className="p-4">
                                                            <p className="text-sm text-gray-600 mb-4">
                                                                Set your price range for <strong>{category}</strong>. Customers will see this when selecting your company.
                                                            </p>
                                                            <div className="flex items-center gap-3 mb-4">
                                                                {isTBD ? (
                                                                    <>
                                                                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">💭 Price TBD</span>
                                                                        <button onClick={() => { const u = { ...subcategoryPrices }; delete u[category]; setSubcategoryPrices(u) }} className="text-sm text-blue-600 hover:underline">Set Price Range</button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {priceData.min && priceData.max ? (
                                                                            <span className="text-base font-bold text-emerald-600">₦{Number(priceData.min).toLocaleString()} – ₦{Number(priceData.max).toLocaleString()}</span>
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400">No price range set</span>
                                                                        )}
                                                                        <button onClick={() => setSubcategoryPrices(prev => ({ ...prev, [category]: { status: 'TBD', lastUpdated: new Date().toISOString() } }))} className="text-sm text-gray-500 hover:underline">Mark as TBD</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {!isTBD && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum Price (₦)</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="e.g., 5000"
                                                                            value={priceData.min || ''}
                                                                            onChange={e => setSubcategoryPrices(prev => ({ ...prev, [category]: { ...prev[category], min: e.target.value, lastUpdated: new Date().toISOString() } }))}
                                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Maximum Price (₦)</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="e.g., 20000"
                                                                            value={priceData.max || ''}
                                                                            onChange={e => setSubcategoryPrices(prev => ({ ...prev, [category]: { ...prev[category], max: e.target.value, lastUpdated: new Date().toISOString() } }))}
                                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {category === 'Logistics Services' && (
                                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                                    <p className="text-xs text-blue-700">💡 <strong>Logistics tip:</strong> Set a range based on distance, package size, and service type. Customers provide exact details when posting jobs.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">HOW PRICING WORKS</p>
                                            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                                                <li><strong>Categories with subcategories</strong> (Electrical, Plumbing, etc.): Set per-service prices</li>
                                                <li><strong>Categories without subcategories</strong> (Logistics, Cleaning): One price range for the whole category</li>
                                                <li><strong className="text-amber-600">TBD</strong> = Price determined after reviewing job details</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Portfolio Pictures */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
                        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="w-7 h-7 bg-naijaGreen/10 rounded-lg flex items-center justify-center text-sm">📸</span>
                            Portfolio
                            <span className="text-sm font-normal text-gray-400 ml-1">{portfolioPictures.length}/10</span>
                        </h3>

                        {portfolioPictures.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                                <div className="text-3xl mb-2 text-gray-300">🖼️</div>
                                <p className="text-sm font-semibold text-gray-500">No portfolio pictures yet</p>
                                <p className="text-xs text-gray-400 mt-1">Show customers examples of your best work</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                                {portfolioPictures.map((pictureUrl, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                                        <img
                                            src={pictureUrl}
                                            alt={`Work ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/default-portfolio.jpg' }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                                            <button
                                                onClick={() => deletePortfolioPicture(pictureUrl)}
                                                className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 text-lg leading-none"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
                                            <p className="text-white text-xs">#{index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upload Photos</label>
                            <input
                                type="file"
                                accept="image/*"
                                ref={portfolioFileInputRef}
                                multiple
                                onChange={handlePortfolioFileChange}
                                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-naijaGreen/10 file:text-naijaGreen hover:file:bg-naijaGreen/20 transition mb-3"
                            />

                            {selectedPortfolioFiles.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-blue-700">{selectedPortfolioFiles.length} file(s) selected</p>
                                        <button
                                            onClick={() => { setSelectedPortfolioFiles([]); if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = '' }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <ul className="space-y-1">
                                        {selectedPortfolioFiles.map((file, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-blue-600">
                                                <span>📷</span>
                                                <span className="truncate">{file.name}</span>
                                                <span className="text-gray-400 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">{10 - portfolioPictures.length} slot{10 - portfolioPictures.length !== 1 ? 's' : ''} remaining</p>
                                <button
                                    onClick={handlePortfolioUpload}
                                    disabled={uploadingPortfolio || selectedPortfolioFiles.length === 0}
                                    className="bg-naijaGreen text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-darkGreen transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {uploadingPortfolio ? (
                                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                                    ) : `Upload (${selectedPortfolioFiles.length})`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Save Bar */}
                    {/* BUG FIX: Original had no z-index on the sticky bar, causing it to
                        render behind modals and dropdowns. z-30 ensures it stays on top. */}
                    <div className="sticky bottom-4 z-30 bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-naijaGreen text-white py-3 rounded-xl font-bold hover:bg-darkGreen transition flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {saving ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                                ) : '💾 Save All Changes'}
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex-1 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Original services cannot be removed. You can add new services and update prices.</p>
                    </div>
                </div>
            )}
        </div>
    )
}