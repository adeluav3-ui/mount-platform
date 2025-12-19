// src/components/ErrorBoundary.jsx
import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
                        <p className="text-gray-700 mb-4">{this.state.error?.message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-naijaGreen text-white px-6 py-2 rounded-lg hover:bg-darkGreen"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary