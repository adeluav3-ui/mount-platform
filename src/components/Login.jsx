// src/components/Login.jsx - MODERN REDESIGN (No Header + Password Toggle)
import React from 'react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext'
import TermsAndConditions from './TermsAndConditions';
import CompanyAgreement from './CompanyAgreement';
import logo from '../assets/logo.png';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConsentCheckbox from './ConsentCheckbox';
import PrivacyPolicy from './PrivacyPolicy';

const mainCategories = [
    "Electrical",
    "Plumbing",
    "Carpentry / Woodwork",
    "AC & Refrigeration",
    "Painting & Finishing",
    "Home Appliances",
    "Security & Smart Home",
    "Roofing & Masonry",
    "Beauty & Personal Care",
    "Cleaning Services",
    "Pest Control & Fumigation",
    "Logistics Services"
]

const subCategoriesByMain = {
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
    "Cleaning Services": [
        "Other"
    ],
    "Pest Control & Fumigation": [
        "Other"
    ],
    "Logistics Services": [
        "Logistics Services"
    ]
}

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [isCompany, setIsCompany] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedServices, setSelectedServices] = useState([])
    const [bankName, setBankName] = useState('')
    const [bankAccount, setBankAccount] = useState('')
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [showTerms, setShowTerms] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false)
    const [companyPicture, setCompanyPicture] = useState(null)
    const [showCompanyAgreement, setShowCompanyAgreement] = useState(false);
    const [companyFormData, setCompanyFormData] = useState({});
    const [showPassword, setShowPassword] = useState(false); // NEW: Password visibility state
    const [searchParams] = useSearchParams();
    const [selectedSubCategories, setSelectedSubCategories] = useState({})
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const { signUp, signIn, supabase } = useSupabase()
    const navigate = useNavigate();

    const toggleMainService = (service) => {
        setSelectedServices(prev => {
            const newSelected = prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]

            // If unselecting a main category, also clear its subcategories
            if (prev.includes(service) && !newSelected.includes(service)) {
                const newSubCategories = { ...selectedSubCategories }
                delete newSubCategories[service]
                setSelectedSubCategories(newSubCategories)
            }

            return newSelected
        })
    }

    const toggleSubService = (mainCategory, subService) => {
        setSelectedSubCategories(prev => {
            const currentSubs = prev[mainCategory] || []
            const newSubs = currentSubs.includes(subService)
                ? currentSubs.filter(s => s !== subService)
                : [...currentSubs, subService]

            return {
                ...prev,
                [mainCategory]: newSubs.length > 0 ? newSubs : undefined
            }
        })
    }
    useEffect(() => {
        const handleEmailConfirmation = async () => {
            const confirmed = searchParams.get('confirmed');

            if (confirmed === 'true') {
                // Show success message
                alert('✅ Email confirmed successfully! You can now log in.');

                // Optional: Auto-switch to login form
                setIsSignUp(false);

                // Clear the URL parameters
                window.history.replaceState({}, '', '/login');
            }
        };

        handleEmailConfirmation();
    }, [searchParams]);
    const handleTermsAccept = async () => {
        if (!consentAccepted) {
            alert('You must accept the Terms & Conditions and Privacy Policy');
            return;
        }
        setShowTerms(false);
        setLoading(true);

        try {
            // Extract the saved form data
            const { email, password, name, phone } = formData;

            console.log("=== CUSTOMER SIGNUP AFTER TERMS ACCEPTANCE ===");
            console.log("1. Email:", email);
            console.log("2. Name:", name);
            console.log("3. Phone:", phone);

            // FIX: Use supabase.auth.signUp directly with redirectTo
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        name: name,
                        phone: phone
                    },
                    emailRedirectTo: window.location.origin + '/login?confirmed=true'
                }
            });

            if (authError) throw authError;

            console.log("4. Auth User ID:", authData.user?.id);

            const userId = authData.user.id

            // INSERT INTO PROFILES
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                full_name: name,
                phone: phone,
                email: email,
                role: 'customer',
                updated_at: new Date().toISOString()
            })
            console.log("5. Profile insert result:", profileError?.message || "Success");

            if (profileError) {
                console.error("Profile insert error:", profileError);
                throw profileError
            }

            // INSERT INTO CUSTOMERS TABLE
            const { error: customerError } = await supabase.from('customers').upsert({
                id: userId,
                customer_name: name,
                phone: phone,
                email: email,
                created_at: new Date().toISOString()
            })
            console.log("6. Customer insert result:", customerError?.message || "Success");

            if (customerError) {
                console.error("Customer insert error:", customerError);
                throw customerError
            }

            alert('Signup complete! Please check your email(spam folder) to confirm signup.');

        } catch (err) {
            setError(err.message);
            console.error('Signup error after terms acceptance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyAgreementAccept = async () => {
        if (!consentAccepted) {
            alert('You must accept the Terms & Conditions and Privacy Policy');
            return;
        }
        setShowCompanyAgreement(false);
        setLoading(true);

        try {
            // Extract saved form data
            const {
                email,
                password,
                companyName,
                address,
                phone,
                selectedServices,
                selectedSubCategories, // OBJECT, not array
                bankName,
                bankAccount,
                code: enteredCode,
                companyPicture
            } = companyFormData;

            console.log("=== COMPANY SIGNUP AFTER AGREEMENT ACCEPTANCE ===");
            console.log("1. Selected Services:", selectedServices);
            console.log("2. Selected Subcategories:", selectedSubCategories);

            // Mark code as used
            await supabase
                .from('verification_codes')
                .update({ used: true })
                .eq('code', enteredCode);

            // CREATE AUTH USER
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        name: companyName,
                        phone: phone
                    },
                    emailRedirectTo: window.location.origin + '/login?confirmed=true'
                }
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            let pictureUrl = null;

            // Upload picture if provided
            if (companyPicture) {
                const fileExt = companyPicture.name.split('.').pop();
                const fileName = `${userId}/profile.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('company-pictures')
                    .upload(fileName, companyPicture, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('company-pictures')
                    .getPublicUrl(fileName);

                pictureUrl = urlData.publicUrl;
            }

            // Create subcategory_prices object from selected subcategories
            const subcategory_prices = {}

            // FIX: Iterate over object entries, not array
            if (selectedSubCategories && typeof selectedSubCategories === 'object') {
                Object.entries(selectedSubCategories).forEach(([mainCategory, subCats]) => {
                    if (subCats && Array.isArray(subCats)) {
                        subCats.forEach(subCat => {
                            subcategory_prices[subCat] = "TBD"
                        })
                    }
                })
            }

            console.log("3. Subcategory prices to save:", subcategory_prices);

            // INSERT PROFILE
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                full_name: companyName,
                phone: phone,
                email: email,
                role: 'company',
                updated_at: new Date().toISOString()
            });

            if (profileError) throw profileError;

            // INSERT COMPANY DETAILS
            const { error: companyInsertError } = await supabase.from('companies').insert({
                id: userId,
                company_name: companyName,
                address: address,
                phone: phone,
                email: email,
                services: selectedServices, // Main categories array
                subcategory_prices: subcategory_prices, // Subcategories object
                bank_name: bankName,
                bank_account: bankAccount,
                approved: true,
                picture_url: pictureUrl,
                agreement_accepted: true,
                agreement_accepted_at: new Date().toISOString(),
                agreement_version: '1.0',
                created_at: new Date().toISOString()
            });

            if (companyInsertError) throw companyInsertError;

            alert('Company created successfully! Agreement accepted. You can now log in.');

        } catch (err) {
            setError(err.message);
            console.error('Company signup error after agreement:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (!isSignUp) {
                // LOGIN - no consent needed
                const { error: loginError } = await signIn(email, password)
                if (loginError) throw loginError
                navigate('/dashboard')
                return
            }

            // ================================
            // CUSTOMER SIGNUP
            // ================================
            if (!isCompany) {
                // Check consent before showing terms
                if (!consentAccepted) {
                    throw new Error('You must accept the Terms & Conditions and Privacy Policy');
                }

                // Show terms and conditions for customer signup
                setFormData({
                    email,
                    password,
                    name,
                    phone,
                    isCompany: false
                });
                setShowTerms(true);
                setLoading(false);
                return;
            }

            // ================================
            // COMPANY SIGNUP
            // ================================
            // Check consent for company too
            if (!consentAccepted) {
                throw new Error('You must accept the Terms & Conditions and Privacy Policy');
            }
            console.log("=== COMPANY SIGNUP DEBUG ===");
            console.log("1. Email:", email);
            console.log("2. Company Name:", companyName);
            console.log("3. Services selected:", selectedServices);
            console.log("4. Code entered:", code);

            if (selectedServices.length === 0) {
                throw new Error("Please select at least one service category");
            }
            // Check subcategories for categories that require them
            const missingSubCategories = selectedServices.filter(mainCat => {
                const subCats = subCategoriesByMain[mainCat] || []
                const hasMultipleOptions = subCats.length > 1 || (subCats.length === 1 && subCats[0] !== "Other")

                if (hasMultipleOptions) {
                    const selectedSubs = selectedSubCategories[mainCat] || []
                    return selectedSubs.length === 0
                }
                return false
            })

            if (missingSubCategories.length > 0) {
                throw new Error(`Please select specific services for: ${missingSubCategories.join(', ')}`);
            }
            const enteredCode = code.trim().toUpperCase();
            console.log("5. Entered code (trimmed):", enteredCode);

            const { data: codeRow, error: codeError } = await supabase
                .from('verification_codes')
                .select('code, used')
                .eq('code', enteredCode)
                .eq('used', false)
                .single();

            console.log("6. Code validation result:", { codeRow, codeError });

            if (codeError || !codeRow) {
                console.log("7. Code invalid or error:", codeError);
                throw new Error('Invalid or already used code.');
            }

            console.log("8. Code is valid! Showing agreement...");

            // Store form data and show agreement
            setCompanyFormData({
                email,
                password,
                companyName,
                address,
                phone,
                selectedServices,
                selectedSubCategories,
                bankName,
                bankAccount,
                code: enteredCode,
                companyPicture
            });

            console.log("9. Setting showCompanyAgreement to true");
            setShowCompanyAgreement(true);
            setLoading(false);
            return;

        } catch (err) {
            setError(err.message)
            console.error('Signup error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <img
                            src={logo}
                            alt="Mount Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Mount</h1>
                </div>

                <div className="max-w-md mx-auto">
                    {/* Form Header */}
                    <div className="mb-10 text-center">
                        <h3 className="text-2xl font-bold text-gray-800">
                            {isSignUp ? 'Create Account' : 'Sign In to Your Account'}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Fill in your details to get started' : 'Enter your credentials to continue'}
                        </p>
                    </div>

                    {/* Role Selector for Signup */}
                    {isSignUp && (
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                I am a:
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCompany(false)}
                                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${!isCompany
                                        ? 'bg-green-50 border-2 border-naijaGreen text-naijaGreen shadow-sm'
                                        : 'bg-gray-100 border-2 border-transparent text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg">👤</span>
                                        <span>Customer</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCompany(true)}
                                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${isCompany
                                        ? 'bg-green-50 border-2 border-naijaGreen text-naijaGreen shadow-sm'
                                        : 'bg-gray-100 border-2 border-transparent text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg">🏢</span>
                                        <span>Service Company</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Customer Signup Fields */}
                        {isSignUp && !isCompany && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="John Adekunle"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="0803 123 4567"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Consent Checkbox - REQUIRED FOR CUSTOMERS */}
                                <div className="mt-4">
                                    <ConsentCheckbox
                                        onAccept={() => setConsentAccepted(true)}
                                        initialAccepted={consentAccepted}
                                    />
                                </div>
                            </>
                        )}

                        {/* Company Signup Fields */}
                        {isSignUp && isCompany && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="ABC Services Ltd"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="0803 123 4567"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Address *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="123 Service Lane, Lagos"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Picture (Optional)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-naijaGreen transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setCompanyPicture(e.target.files[0])}
                                            className="hidden"
                                            id="company-picture"
                                        />
                                        <label htmlFor="company-picture" className="cursor-pointer">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-xl">📷</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {companyPicture ? companyPicture.name : 'Click to upload company logo'}
                                                </span>
                                                <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Services Selection */}
                                {/* Services Selection */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div className="mb-4">
                                        <p className="font-semibold text-gray-800 text-lg mb-1">Services You Offer *</p>
                                        <p className="text-sm text-gray-600">Select at least one service category</p>
                                    </div>

                                    {/* Main Categories */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        {mainCategories.map(service => (
                                            <label
                                                key={service}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedServices.includes(service)
                                                    ? 'bg-green-50 border border-naijaGreen'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServices.includes(service)}
                                                    onChange={() => toggleMainService(service)}
                                                    className="w-5 h-5 text-naijaGreen rounded focus:ring-naijaGreen"
                                                />
                                                <span className="font-medium text-gray-700">{service}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Subcategories for selected main categories */}
                                    {selectedServices.map(mainCategory => {
                                        const subCategories = subCategoriesByMain[mainCategory] || []

                                        // Don't show subcategory selection for categories with only "Other"
                                        if (subCategories.length === 1 && subCategories[0] === "Other") {
                                            return null
                                        }

                                        return (
                                            <div key={`subs-${mainCategory}`} className="mb-4 p-4 bg-white rounded-lg border border-gray-300">
                                                <h4 className="font-semibold text-gray-800 mb-3">
                                                    {mainCategory} - Select specific services you offer:
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {subCategories.map(subService => (
                                                        <label
                                                            key={subService}
                                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${selectedSubCategories[mainCategory]?.includes(subService)
                                                                ? 'bg-blue-50 border border-blue-300'
                                                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubCategories[mainCategory]?.includes(subService) || false}
                                                                onChange={() => toggleSubService(mainCategory, subService)}
                                                                className="w-4 h-4 text-naijaGreen rounded focus:ring-naijaGreen"
                                                            />
                                                            <span className="text-sm text-gray-700">{subService}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Selected: {selectedSubCategories[mainCategory]?.length || 0} services
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-4">
                                    <ConsentCheckbox
                                        onAccept={() => setConsentAccepted(true)}
                                        initialAccepted={consentAccepted}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bank Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Access Bank"
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Account Number *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="1234567890"
                                            value={bankAccount}
                                            onChange={e => setBankAccount(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Code *
                                        <span className="text-xs text-gray-500 ml-2">(Provided by Mount)</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter code e.g. WORK123"
                                        value={code}
                                        onChange={e => setCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-colors font-mono tracking-wider"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Click the eye icon to show/hide password
                                </p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>

                                {/* Add resend confirmation for email not confirmed errors */}
                                {error.includes('not confirmed') || error.includes('Email not confirmed') ? (
                                    <div className="mt-3">
                                        <p className="text-sm text-red-600 mb-2">Your email needs to be confirmed.</p>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const { error: resendError } = await supabase.auth.resend({
                                                        type: 'signup',
                                                        email: email,
                                                        options: {
                                                            emailRedirectTo: window.location.origin + '/login?confirmed=true'
                                                        }
                                                    });
                                                    if (resendError) throw resendError;
                                                    alert('✅ Confirmation email resent! Check your inbox.');
                                                } catch (err) {
                                                    setError('Failed to resend: ' + err.message);
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            Resend Confirmation Email
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || (isSignUp && !consentAccepted)}
                            className={`w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${(isSignUp && !consentAccepted) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                    <span className="text-lg">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Link */}
                    <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                        <p className="text-gray-600">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-naijaGreen font-semibold hover:text-darkGreen transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Create Account'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions Modal for Customers */}
            <TermsAndConditions
                isOpen={showTerms}
                onAccept={handleTermsAccept}
                onClose={() => {
                    setShowTerms(false);
                    setLoading(false);
                }}
            />

            {/* Company Agreement Modal for Service Providers */}
            <CompanyAgreement
                isOpen={showCompanyAgreement}
                companyName={companyFormData.companyName}
                onAccept={handleCompanyAgreementAccept}
                onClose={() => {
                    setShowCompanyAgreement(false);
                    setLoading(false);
                }}
            />
            {/* Privacy Policy Modal */}
            <PrivacyPolicy
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </div>
    )
}