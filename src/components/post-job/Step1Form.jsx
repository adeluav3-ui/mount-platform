// src/components/post-job/Step1Form.jsx
import React from 'react';
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useEffect } from 'react'
import LogisticsFields from './LogisticsFields';

const ogunLocations = [
    'Abeokuta', 'Sango-Ota', 'Ijebu-Ode', 'Sagamu',
    'Ota', 'Mowe-Ibafo', 'Ewekoro', 'Ilaro', 'Ifo', 'Owode', 'Odeda', 'Others'
]

const categoryIcons = {
    'Electrical': '⚡',
    'Plumbing': '🔧',
    'Carpentry / Woodwork': '🪵',
    'AC & Refrigeration': '❄️',
    'Painting & Finishing': '🎨',
    'Security & Smart Home': '🔒',
    'Roofing & Masonry': '🏗️',
    'Cleaning Services': '🧹',
    'Pest Control & Fumigation': '🛡️',
    'Logistics Services': '🚚',
}

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
    services = {},
    user,
    setHasPriorityMatching,
}) {
    const [activeSection, setActiveSection] = useState(null);

    useEffect(() => {
        return () => {
            photoPreviews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    const categoryHasSubservices = (category) => {
        const subservices = services[category] || []
        return subservices.length > 0 && !(subservices.length === 1 && subservices[0] === "Other")
    }

    const validateForm = () => {
        const errors = []
        if (!job.category) errors.push('Please select a service category')
        if (categoryHasSubservices(job.category) && !job.sub_service) errors.push('Please select a specific service')
        if (job.sub_service === 'Other' && !job.custom_sub?.trim()) errors.push('Please specify the custom service')
        if (!job.location) errors.push('Please select your location')
        if (!job.exact_address?.trim()) errors.push('Please enter your exact address')
        if (job.exact_address?.trim().length < 10) errors.push('Address should be at least 10 characters')
        if (!job.description?.trim()) errors.push('Please describe the job')
        if (job.description?.trim().length < 10) errors.push('Description should be at least 10 characters')

        if (job.category === 'Logistics Services') {
            if (!job.logistics_type) errors.push('Please select logistics service type (Pickup or Delivery)')
            if (!job.logistics_destination_type) errors.push('Please select destination type')
            if (job.logistics_destination_type === 'intrastate' && !job.logistics_destination_location) errors.push('Please select destination area in Ogun State')
            if (job.logistics_destination_type === 'interstate' && !job.logistics_interstate_state) errors.push('Please select destination state')
            if (!job.logistics_contact_phone?.trim()) errors.push(`Please enter ${job.logistics_type === 'pickup' ? "sender's" : "receiver's"} phone number`)
            else {
                const phoneRegex = /^(0[7-9][0-1]\d{8}|\+234[7-9][0-1]\d{8})$/;
                if (!phoneRegex.test(job.logistics_contact_phone.replace(/\s+/g, ''))) errors.push('Please enter a valid Nigerian phone number')
            }
            if (!job.logistics_other_address?.trim()) errors.push(`Please enter ${job.logistics_type === 'pickup' ? 'pickup' : 'delivery'} address`)
            if (job.logistics_other_address?.trim().length < 10) errors.push(`${job.logistics_type === 'pickup' ? 'Pickup' : 'Delivery'} address should be at least 10 characters`)
        }
        return errors
    }

    const handleNext = async () => {
        const errors = validateForm()
        if (errors.length > 0) { alert(errors.join('\n')); return }

        const { data, error } = await supabase
            .from('companies')
            .select(`
                id, company_name, email, phone, address, picture_url,
                portfolio_pictures, services, subcategory_prices, telegram_chat_id,
                logistics_service_type, logistics_served_locations, logistics_interstate_states,
                average_rating, total_reviews, approved, company_policies,
                priority_score, created_at, updated_at
            `)
            .eq('approved', true)

        if (error) { alert('Failed to load companies: ' + error.message); return }

        const jobWithDefaults = { ...job, price: job.price || 'N/A' };

        const matches = data.filter(c => {
            const offersCategory = c.services?.includes(jobWithDefaults.category)
            if (!offersCategory) return false
            if (jobWithDefaults.category === 'Logistics Services') {
                if (c.company_name === 'Yharah logistics' || c.company_name === 'Yharah Logistics') {
                    if (jobWithDefaults.logistics_destination_type === 'intrastate') return jobWithDefaults.logistics_destination_location === 'Abeokuta';
                    return false;
                }
                return true;
            }
            return true
        })

        if (matches.length === 0) { alert(`No companies found for "${jobWithDefaults.category}" service.`); return }

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('customer_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        const hasPriority = ['standard', 'premium'].includes(subscription?.plan);

        const sortedMatches = [...matches].sort((a, b) =>
            hasPriority
                ? (b.priority_score || 0) - (a.priority_score || 0)
                : new Date(a.created_at) - new Date(b.created_at)
        );

        setHasPriorityMatching(hasPriority);
        setCompanies(sortedMatches);
        setStep(2);
    }

    const completedSections = [
        job.category,
        job.location && job.exact_address?.trim().length >= 10,
        job.description?.trim().length >= 10,
    ].filter(Boolean).length;

    const totalSections = 3;
    const progress = Math.round((completedSections / totalSections) * 100);

    return (
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

                .field-input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 15px;
                    font-family: 'DM Sans', sans-serif;
                    background: #fafafa;
                    color: #111827;
                    transition: all 0.2s ease;
                    outline: none;
                    appearance: none;
                    -webkit-appearance: none;
                }
                .field-input:focus {
                    border-color: #16a34a;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
                }
                .field-input::placeholder { color: #9ca3af; }

                .section-card {
                    background: #fff;
                    border: 1.5px solid #f3f4f6;
                    border-radius: 16px;
                    padding: 24px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .section-card:focus-within {
                    border-color: #d1fae5;
                    box-shadow: 0 4px 20px rgba(22, 163, 74, 0.06);
                }

                .category-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 100px;
                    background: #fafafa;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    white-space: nowrap;
                }
                .category-chip:hover { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
                .category-chip.selected {
                    border-color: #16a34a;
                    background: #16a34a;
                    color: #fff;
                }

                .photo-thumb {
                    position: relative;
                    width: 88px;
                    height: 88px;
                    border-radius: 12px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .submit-btn {
                    width: 100%;
                    padding: 17px;
                    background: #16a34a;
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: -0.01em;
                }
                .submit-btn:hover { background: #15803d; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(22, 163, 74, 0.3); }
                .submit-btn:active { transform: translateY(0); }

                .field-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                }

                .progress-bar {
                    height: 3px;
                    background: #e5e7eb;
                    border-radius: 100px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #16a34a, #22c55e);
                    border-radius: 100px;
                    transition: width 0.4s ease;
                }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                            What do you need done?
                        </h1>
                        <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4, fontWeight: 400 }}>
                            Fill in the details and we'll find the right professionals
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', fontFamily: "'DM Sans', sans-serif" }}>{progress}%</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>complete</div>
                    </div>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Section 1 — Service */}
                <div className="section-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: job.category ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                            {job.category
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                : <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>1</span>
                            }
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Service Category</span>
                        {job.category && <span style={{ marginLeft: 'auto', fontSize: 13, color: '#16a34a', fontWeight: 500 }}>{categoryIcons[job.category]} {job.category}</span>}
                    </div>

                    {/* Category chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Object.keys(services).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                className={`category-chip ${job.category === cat ? 'selected' : ''}`}
                                onClick={() => setJob({ ...job, category: cat, sub_service: '', custom_sub: '' })}
                            >
                                <span>{categoryIcons[cat] || '🔨'}</span>
                                <span>{cat}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sub-service */}
                    {job.category && categoryHasSubservices(job.category) && (
                        <div style={{ marginTop: 16 }}>
                            <label className="field-label">Specific Service</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={job.sub_service}
                                    onChange={e => setJob({ ...job, sub_service: e.target.value, custom_sub: '' })}
                                    className="field-input"
                                    style={{ paddingRight: 40 }}
                                >
                                    <option value="">Choose specific service</option>
                                    {services[job.category].map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                                <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                        </div>
                    )}

                    {/* Custom sub */}
                    {job.sub_service === 'Other' && (
                        <div style={{ marginTop: 12 }}>
                            <label className="field-label">Describe the service</label>
                            <input
                                value={job.custom_sub}
                                onChange={e => setJob({ ...job, custom_sub: e.target.value })}
                                placeholder="e.g. Install a new power outlet in my bedroom..."
                                className="field-input"
                            />
                        </div>
                    )}
                </div>

                {/* Section 2 — Location */}
                <div className="section-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: (job.location && job.exact_address?.trim().length >= 10) ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                            {(job.location && job.exact_address?.trim().length >= 10)
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                : <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>2</span>
                            }
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Your Location</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="field-label">Area</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={job.location}
                                    onChange={e => setJob({ ...job, location: e.target.value })}
                                    className="field-input"
                                    style={{ paddingRight: 40 }}
                                >
                                    <option value="">Select your area</option>
                                    {ogunLocations.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Full Address <span style={{ color: '#ef4444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span></label>
                            <textarea
                                rows={3}
                                value={job.exact_address}
                                onChange={e => setJob({ ...job, exact_address: e.target.value })}
                                placeholder="House number, street name, nearest landmark..."
                                className="field-input"
                                style={{ resize: 'none', lineHeight: 1.6 }}
                            />
                            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Include landmarks to help providers find you easily</p>
                        </div>
                    </div>
                </div>

                {/* Logistics fields */}
                {job.category === 'Logistics Services' && (
                    <div className="section-card">
                        <LogisticsFields job={job} setJob={setJob} />
                    </div>
                )}

                {/* Section 3 — Job Details */}
                <div className="section-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: job.description?.trim().length >= 10 ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                            {job.description?.trim().length >= 10
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                : <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>3</span>
                            }
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Job Details</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="field-label">Description</label>
                            <textarea
                                rows={4}
                                value={job.description}
                                onChange={e => setJob({ ...job, description: e.target.value })}
                                placeholder="Describe exactly what needs to be done, any issues you've noticed, materials needed..."
                                className="field-input"
                                style={{ resize: 'none', lineHeight: 1.6 }}
                            />
                        </div>

                        <div>
                            <label className="field-label">Budget <span style={{ color: '#9ca3af', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>(optional)</span></label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 600, color: '#6b7280', pointerEvents: 'none' }}>₦</span>
                                <input
                                    type="number"
                                    value={job.price}
                                    onChange={e => setJob({ ...job, price: e.target.value })}
                                    placeholder="0"
                                    className="field-input"
                                    style={{ paddingLeft: 32 }}
                                    min="0"
                                    step="100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="section-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 14 }}>📷</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Photos <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>— optional</span></span>
                    </div>

                    {photoPreviews.length === 0 ? (
                        <label style={{ display: 'block', border: '1.5px dashed #d1d5db', borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative', background: '#fafafa' }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#16a34a'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>Tap to add photos</p>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Helps providers understand the job better</p>
                            <input type="file" multiple accept="image/*" onChange={e => handlePhotoSelect(Array.from(e.target.files))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </label>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {photoPreviews.map((src, i) => (
                                    <div key={i} className="photo-thumb">
                                        <img src={src} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button onClick={() => handleDeletePhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>×</button>
                                        <button onClick={() => openCropper(i)} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 0' }}>Crop</button>
                                    </div>
                                ))}
                                <label style={{ width: 88, height: 88, borderRadius: 12, border: '1.5px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', flexShrink: 0, position: 'relative' }}>
                                    <span style={{ fontSize: 20, marginBottom: 2 }}>+</span>
                                    <span style={{ fontSize: 10, color: '#9ca3af' }}>Add more</span>
                                    <input type="file" multiple accept="image/*" onChange={e => handlePhotoSelect(Array.from(e.target.files))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button onClick={handleNext} className="submit-btn" style={{ marginTop: 4 }}>
                    Find Verified Companies
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
            </div>
        </div>
    )
}