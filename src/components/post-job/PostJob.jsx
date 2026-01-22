// src/components/post-job/PostJob.jsx — FINAL & CATEGORIES SHOW 100%
import React from 'react';
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useRef } from 'react'
import Step1Form from './Step1Form'
import Step2Companies from './Step2Companies'
import Step3Wait from './Step3Wait'
import CropModal from './CropModal'
import Step2ToStep3Loader from './Step2ToStep3Loader'

// MOVED TO THE TOP — THIS WAS THE FIX
const services = {
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

    "Cleaning Services": [], // Empty array = no subservices
    "Pest Control & Fumigation": [], // Empty array = no subservices
    "Logistics Services": [] // Empty array = no subservices
}

export default function PostJob() {
    const { user, supabase } = useSupabase()

    const [job, setJob] = useState({
        category: '',
        sub_service: '',
        custom_sub: '',
        location: '',
        exact_address: '',
        description: '',
        price: '',
        logistics_type: '',
        logistics_contact_phone: '',
        logistics_other_address: ''
    })

    const [companies, setCompanies] = useState([])
    const [step, setStep] = useState(1)
    const [selectedCompany, setSelectedCompany] = useState(null)
    const [tempSelectedCompany, setTempSelectedCompany] = useState(null)

    // LOADER STATES
    const [showLoader, setShowLoader] = useState(false)
    const [loaderCompanyName, setLoaderCompanyName] = useState('')

    const photoFilesRef = useRef([])
    const [photoPreviews, setPhotoPreviews] = useState([])

    const [isCropOpen, setIsCropOpen] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const handlePhotoSelect = (files) => {
        photoFilesRef.current = [...photoFilesRef.current, ...files]
        const previews = files.map(f => URL.createObjectURL(f))
        setPhotoPreviews(prev => [...prev, ...previews])
    }

    const handleDeletePhoto = (index) => {
        photoPreviews.splice(index, 1)
        photoFilesRef.current.splice(index, 1)
        setPhotoPreviews([...photoPreviews])
    }

    const openCropper = (index) => {
        setSelectedImageIndex(index)
        setIsCropOpen(true)
    }

    const applyCrop = async (croppedBlob) => {
        const originalFile = photoFilesRef.current[selectedImageIndex]
        const croppedFile = new File([croppedBlob], originalFile.name, { type: 'image/jpeg' })
        const newPreview = URL.createObjectURL(croppedBlob)

        photoPreviews[selectedImageIndex] = newPreview
        photoFilesRef.current[selectedImageIndex] = croppedFile
        setPhotoPreviews([...photoPreviews])
        setIsCropOpen(false)
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
            {step === 1 && (
                <Step1Form
                    job={job}
                    setJob={setJob}
                    setCompanies={setCompanies}
                    setStep={setStep}
                    photoFilesRef={photoFilesRef}
                    photoPreviews={photoPreviews}
                    setPhotoPreviews={setPhotoPreviews}
                    handlePhotoSelect={handlePhotoSelect}
                    handleDeletePhoto={handleDeletePhoto}
                    openCropper={openCropper}
                    supabase={supabase}
                    services={services}  // NOW VISIBLE
                />
            )}

            {step === 2 && (
                <Step2Companies
                    companies={companies}
                    job={job}
                    setSelectedCompany={setSelectedCompany}
                    setStep={setStep}
                    user={user}
                    supabase={supabase}
                    photoFilesRef={photoFilesRef}
                    setShowLoader={setShowLoader}
                    setLoaderCompanyName={setLoaderCompanyName}
                    setTempSelectedCompany={setTempSelectedCompany}
                    services={services}
                />
            )}

            {step === 3 && (
                <Step3Wait
                    selectedCompany={selectedCompany || tempSelectedCompany}
                />
            )}

            {showLoader && (
                <Step2ToStep3Loader
                    companyName={loaderCompanyName}
                    companyData={tempSelectedCompany}
                    jobData={job}
                    onComplete={() => {
                        setShowLoader(false)
                        setStep(3)
                    }}
                />
            )}

            <CropModal
                isOpen={isCropOpen}
                imageSrc={photoPreviews[selectedImageIndex]}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => {
                    // You can store this if needed, but handleSave in CropModal uses its own state
                }}
                onClose={() => setIsCropOpen(false)}
                onSave={applyCrop}
            />
        </div>
    )
}