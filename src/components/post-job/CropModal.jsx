// FIXED CropModal.jsx
import React from 'react';
import Cropper from 'react-easy-crop'
import { useState } from 'react' // Added import

async function cropImage(imageSrc, cropAreaPixels) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = imageSrc
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // Set canvas dimensions
            canvas.width = cropAreaPixels.width
            canvas.height = cropAreaPixels.height

            // Draw cropped image
            ctx.drawImage(
                img,
                cropAreaPixels.x,
                cropAreaPixels.y,
                cropAreaPixels.width,
                cropAreaPixels.height,
                0, 0,
                cropAreaPixels.width,
                cropAreaPixels.height
            )

            // Convert to blob
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Canvas to Blob conversion failed'))
                }
            }, 'image/jpeg', 0.95)
        }
        img.onerror = () => reject(new Error('Image loading failed'))
    })
}

export default function CropModal({ isOpen, imageSrc, crop, zoom, onCropChange, onZoomChange, onCropComplete, onClose, onSave }) {
    const [currentCroppedAreaPixels, setCurrentCroppedAreaPixels] = useState(null)

    if (!isOpen) return null

    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCurrentCroppedAreaPixels(croppedAreaPixels)
        onCropComplete?.(croppedArea, croppedAreaPixels)
    }

    const handleSave = async () => {
        if (!currentCroppedAreaPixels) {
            alert('Please adjust the crop area first')
            return
        }

        try {
            const croppedBlob = await cropImage(imageSrc, currentCroppedAreaPixels)
            onSave(croppedBlob)
        } catch (error) {
            console.error('Cropping failed:', error)
            alert('Failed to crop image. Please try again.')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
                <h2 className="text-xl font-bold mb-4 text-center">Crop Image</h2>
                <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={handleCropComplete}
                        cropShape="rect"
                    />
                </div>
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition"
                    >
                        Save Crop
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
                    >
                        Cancel
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                    Drag to adjust, pinch/spread to zoom
                </p>
            </div>
        </div>
    )
}