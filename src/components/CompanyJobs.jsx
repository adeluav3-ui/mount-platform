import { useSupabase } from '../context/SupabaseContext'
import { useState, useEffect } from 'react'

export default function CompanyJobs() {
    const { user, supabase } = useSupabase()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel('jobs')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jobs',
                    filter: `company_id=eq.${user.id}`
                },
                () => fetchJobs()
            )
            .subscribe()

        fetchJobs()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase])

    const fetchJobs = async () => {
        const { data } = await supabase
            .from('jobs')
            .select('*, customer:customer_id(email)')
            .eq('company_id', user.id)
            .order('created_at', { ascending: false })

        setJobs(data || [])
        setLoading(false)
    }

    const markAsDone = async (jobId) => {
        if (confirm('Customer said “Job Done Well”?\nFinal 50% will be released to your bank.')) {
            await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)
            alert('Job completed! Final payment released.\nThank you for using Mount.')
            fetchJobs() // refresh list
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-3xl text-naijaGreen font-bold">Loading jobs...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-naijaGreen text-white shadow-xl">
                <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-wide">Mount • New Jobs</h1>
                    <button
                        onClick={() => (window.location.href = '/dashboard')}
                        className="bg-white text-naijaGreen font-bold px-6 py-2.5 rounded-full hover:bg-gray-100 transition"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-8">
                {jobs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl text-gray-600 font-bold">No new jobs yet</p>
                        <p className="text-2xl text-gray-500 mt-4">
                            When customers book you, they’ll appear here instantly!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-naijaGreen/20"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                    <div className="flex-1">
                                        <h3 className="text-4xl font-extrabold text-naijaGreen">
                                            {job.category}
                                        </h3>
                                        <p className="text-2xl mt-4">
                                            <strong>Location:</strong> {job.location}
                                        </p>
                                        <p className="text-xl mt-4 leading-relaxed">{job.description}</p>
                                        <p className="text-xl mt-6">
                                            <strong>Customer:</strong> {job.customer?.email}
                                        </p>
                                        <p className="text-3xl font-bold text-naijaGreen mt-8">
                                            Total: ₦{Number(job.total_price).toLocaleString()} | Upfront Paid:{' '}
                                            ₦{Number(job.upfront_paid).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        {job.status === 'paid' && (
                                            <button
                                                onClick={() => markAsDone(job.id)}
                                                className="bg-naijaGreen hover:bg-darkGreen text-white font-extrabold text-2xl px-12 py-10 rounded-3xl shadow-2xl transform hover:scale-105 transition"
                                            >
                                                Job Done Well
                                                <br />
                                                Release Final 50%
                                            </button>
                                        )}
                                        {job.status === 'completed' && (
                                            <div className="bg-green-100 text-green-800 font-bold text-2xl px-12 py-10 rounded-3xl text-center">
                                                Completed
                                                <br />
                                                Full Payment Received
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}