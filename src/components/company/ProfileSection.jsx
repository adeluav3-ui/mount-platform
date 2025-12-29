// src/components/company/ProfileSection.jsx — WITH PORTFOLIO PICTURES
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
    ]
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
    const navigate = useNavigate();

    // Initialize portfolio pictures from company data
    useEffect(() => {
        if (company?.portfolio_pictures) {
            setPortfolioPictures(company.portfolio_pictures)
        }
    }, [company])

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
    const handlePortfolioFileChange = (e) => {
        const files = Array.from(e.target.files)

        // Validate file count
        if (portfolioPictures.length + files.length > 5) {
            alert(`You can only upload a maximum of 5 portfolio pictures. You currently have ${portfolioPictures.length} and tried to add ${files.length}.`)
            e.target.value = ''
            setSelectedPortfolioFiles([])
            return
        }

        setSelectedPortfolioFiles(files)
    }
    // Function to upload portfolio pictures
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

                // Upload to Supabase Storage
                const { error } = await supabase.storage
                    .from('company-portfolio')
                    .upload(fileName, file, { upsert: false })

                if (error) throw error

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('company-portfolio')
                    .getPublicUrl(fileName)

                uploadedUrls.push(publicUrl)
            }

            // Update portfolio pictures state
            const newPortfolioPictures = [...portfolioPictures, ...uploadedUrls]
            setPortfolioPictures(newPortfolioPictures)
            setSelectedPortfolioFiles([]) // Clear selected files

            // Update in database
            const { error } = await supabase
                .from('companies')
                .update({ portfolio_pictures: newPortfolioPictures })
                .eq('id', user.id)

            if (error) throw error

            alert(`Successfully uploaded ${selectedPortfolioFiles.length} portfolio picture(s)!`)
            if (portfolioFileInputRef.current) {
                portfolioFileInputRef.current.value = '' // Clear input
            }

        } catch (error) {
            console.error('Error uploading portfolio pictures:', error)
            alert('Failed to upload portfolio pictures: ' + error.message)
        } finally {
            setUploadingPortfolio(false)
        }
    }

    // Function to delete a portfolio picture
    const deletePortfolioPicture = async (pictureUrl) => {
        if (!confirm('Are you sure you want to delete this portfolio picture?')) return

        try {
            // Extract filename from URL
            const urlParts = pictureUrl.split('/')
            const fileName = urlParts[urlParts.length - 1]
            const fullPath = `${user.id}/portfolio/${fileName}`

            // Remove from storage
            const { error: storageError } = await supabase.storage
                .from('company-portfolio')
                .remove([fullPath])

            if (storageError) console.warn('Could not delete from storage:', storageError)

            // Remove from array
            const newPortfolioPictures = portfolioPictures.filter(url => url !== pictureUrl)
            setPortfolioPictures(newPortfolioPictures)

            // Update database
            const { error } = await supabase
                .from('companies')
                .update({ portfolio_pictures: newPortfolioPictures })
                .eq('id', user.id)

            if (error) throw error

            alert('Portfolio picture deleted successfully!')
        } catch (error) {
            console.error('Error deleting portfolio picture:', error)
            alert('Failed to delete portfolio picture: ' + error.message)
        }
    }

    const handleSave = async () => {
        const updates = {
            company_name: form.company_name,
            address: form.address,
            phone: form.phone,
            bank_name: form.bank_name,
            bank_account: form.bank_account,
            services: selectedCategories,
            subcategory_prices: subcategoryPrices,
            portfolio_pictures: portfolioPictures // Include portfolio pictures
        }

        if (profileFileInputRef.current?.files[0]) {
            const file = profileFileInputRef.current.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/profile.${fileExt}`
            await supabase.storage.from('company-pictures').upload(fileName, file, { upsert: true })
            const { data: { publicUrl } } = supabase.storage.from('company-pictures').getPublicUrl(fileName)
            updates.picture_url = publicUrl
            setPictureKey(Date.now()) // Refresh profile picture
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
                        <input
                            type="file"
                            accept="image/*"
                            ref={profileFileInputRef}
                            className="block mx-auto"
                        />
                        <p className="text-sm text-gray-600 mt-2">Upload new profile picture</p>
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

                    {/* PORTFOLIO PICTURES SECTION */}
                    {/* PORTFOLIO PICTURES SECTION */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                        <h4 className="text-xl font-bold text-naijaGreen mb-6 flex items-center gap-2">
                            <span>📸 Portfolio Pictures</span>
                            <span className="text-sm font-normal text-gray-600">
                                (Max 5 pictures) - Customers will see these when choosing companies
                            </span>
                        </h4>

                        {/* Current Portfolio Pictures */}
                        <div className="mb-6">
                            <h5 className="font-medium text-gray-700 mb-3">Current Portfolio ({portfolioPictures.length}/5)</h5>
                            {portfolioPictures.length === 0 ? (
                                <div className="text-center py-6 bg-white rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="text-4xl mb-2 text-gray-400">📷</div>
                                    <p className="text-gray-500">No portfolio pictures yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Add pictures of your work to attract customers</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {portfolioPictures.map((pictureUrl, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={pictureUrl}
                                                alt={`Portfolio ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                                                onError={(e) => {
                                                    e.target.src = '/default-portfolio.jpg'
                                                    e.target.alt = 'Image failed to load'
                                                }}
                                            />
                                            <button
                                                onClick={() => deletePortfolioPicture(pictureUrl)}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                                title="Delete picture"
                                            >
                                                ×
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                                <p className="text-white text-xs">Portfolio {index + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload New Portfolio Pictures */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h5 className="font-medium text-gray-700 mb-3">Upload New Pictures</h5>
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={portfolioFileInputRef}
                                    multiple
                                    onChange={handlePortfolioFileChange}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-naijaGreen transition"
                                />

                                {/* Selected Files Preview */}
                                {selectedPortfolioFiles.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm font-medium text-blue-800 mb-2">
                                            Selected {selectedPortfolioFiles.length} file(s):
                                        </p>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            {selectedPortfolioFiles.map((file, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <span className="text-xs">📷</span>
                                                    <span className="truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPortfolioFiles([])
                                                if (portfolioFileInputRef.current) {
                                                    portfolioFileInputRef.current.value = ''
                                                }
                                            }}
                                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                                        >
                                            Clear selection
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        {portfolioPictures.length}/5 pictures uploaded •
                                        {selectedPortfolioFiles.length > 0 && (
                                            <span className="ml-2 text-naijaGreen font-medium">
                                                +{selectedPortfolioFiles.length} selected
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handlePortfolioUpload}
                                        disabled={uploadingPortfolio || selectedPortfolioFiles.length === 0}
                                        className="px-6 py-2 bg-naijaGreen text-white rounded-lg font-medium hover:bg-darkGreen disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {uploadingPortfolio ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : `Upload ${selectedPortfolioFiles.length > 0 ? `(${selectedPortfolioFiles.length})` : ''}`}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    📌 Tip: Upload high-quality pictures of your completed work to build trust with customers
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SUBCATEGORY PRICING */}
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