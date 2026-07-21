// app/admin/communities/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

interface City {
    id: number;
    name: string;
    slug: string;
}

interface Country {
    id: number;
    name: string;
}

interface State {
    id: number;
    name: string;
}

interface Community {
    id: number;
    name: string;
    slug: string;
    city_id: number;
    state_id: number | null;
    country_id: number;
    description: string | null;
    img: string | null;
    status: number;
    featured: number;
    latitude: string | null;
    longitude: string | null;
    seo_title: string | null;
    seo_keywork: string | null;
    seo_description: string | null;
}

export default function AdminCommunityEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [formData, setFormData] = useState<Community | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ─── Fetch data ──────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch community
                const communityRes = await fetch(`/api/v1/admin/communities?id=${id}`, {
                    credentials: 'include',
                });
                const communityData = await communityRes.json();

                if (!communityData.success) {
                    toast.error(communityData.message || 'Community not found');
                    router.push('/admin/communities');
                    return;
                }

                setFormData(communityData.data);

                // Fetch filters
                const filtersRes = await fetch('/api/v1/admin/communities?filters=true', {
                    credentials: 'include',
                });
                const filtersData = await filtersRes.json();
                if (filtersData.success) {
                    setCities(filtersData.data.cities || []);
                    setCountries(filtersData.data.countries || []);
                    setStates(filtersData.data.states || []);
                }
            } catch (error: any) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'Failed to load community');
                router.push('/admin/communities');
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchData();
    }, [id, router]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        if (!formData) return false;
        const newErrors: Record<string, string> = {};
        if (!formData.name || formData.name.length < 2) {
            newErrors.name = 'Name is required (min 2 characters)';
        }
        if (!formData.city_id) {
            newErrors.city_id = 'City is required';
        }
        if (!formData.country_id) {
            newErrors.country_id = 'Country is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !validate()) {
            toast.error('Please fix all errors');
            return;
        }

        setSaving(true);
        try {
            // ✅ FIXED: id ko alag se bhejo, spread mein mat daalo
            const payload = {
                id: formData.id,
                name: formData.name,
                slug: formData.slug,
                city_id: formData.city_id,
                state_id: formData.state_id,
                country_id: formData.country_id,
                description: formData.description,
                img: formData.img,
                status: formData.status,
                featured: formData.featured,
                latitude: formData.latitude,
                longitude: formData.longitude,
                seo_title: formData.seo_title,
                seo_keywork: formData.seo_keywork,
                seo_description: formData.seo_description,
            };

            const res = await fetch('/api/v1/admin/communities', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Community updated!');
                setTimeout(() => router.push('/admin/communities'), 1000);
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                    toast.error('Please fix all errors');
                } else {
                    toast.error(data.message || 'Failed to update community');
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update community');
        } finally {
            setSaving(false);
        }
    };

    // ─── Loading ──────────────────────────────────────────────────────────
    if (loading || !formData) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-500">Loading community...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
                        >
                            <FiArrowLeft size={18} /> Back
                        </button>
                        <h1 className="text-2xl font-semibold text-neutral-900">Edit Community</h1>
                        <p className="text-sm text-neutral-500 mt-1">{formData.name}</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={18} />}
                        {saving ? 'Saving...' : 'Update'}
                    </button>
                </div>

                {/* Form - Same as Create */}
                <form className="bg-white rounded-xl p-6 border shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-500/20' : 'border-neutral-200 focus:ring-neutral-900/20'}`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Slug</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Country *</label>
                            <select
                                name="country_id"
                                value={formData.country_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${errors.country_id ? 'border-red-300 focus:ring-red-500/20' : 'border-neutral-200 focus:ring-neutral-900/20'}`}
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.country_id && <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>}
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">City *</label>
                            <select
                                name="city_id"
                                value={formData.city_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${errors.city_id ? 'border-red-300 focus:ring-red-500/20' : 'border-neutral-200 focus:ring-neutral-900/20'}`}
                            >
                                <option value="">Select City</option>
                                {cities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.city_id && <p className="mt-1 text-sm text-red-500">{errors.city_id}</p>}
                        </div>

                        {/* State */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
                            <select
                                name="state_id"
                                value={formData.state_id || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            >
                                <option value="">Select State</option>
                                {states.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                        </div>

                        {/* Featured */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Featured</label>
                            <select
                                name="featured"
                                value={formData.featured}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            >
                                <option value={0}>No</option>
                                <option value={1}>Yes</option>
                            </select>
                        </div>

                        {/* Coordinates */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Latitude</label>
                            <input
                                type="text"
                                name="latitude"
                                value={formData.latitude || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Longitude</label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Image URL</label>
                            <input
                                type="text"
                                name="img"
                                value={formData.img || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-y"
                            />
                        </div>

                        {/* SEO */}
                        <div className="md:col-span-2 border-t pt-4">
                            <h3 className="font-medium text-neutral-900 mb-3">SEO Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-neutral-600 mb-1.5">SEO Title</label>
                                    <input
                                        type="text"
                                        name="seo_title"
                                        value={formData.seo_title || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-600 mb-1.5">SEO Keywords</label>
                                    <input
                                        type="text"
                                        name="seo_keywork"
                                        value={formData.seo_keywork || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-neutral-600 mb-1.5">SEO Description</label>
                                    <textarea
                                        name="seo_description"
                                        value={formData.seo_description || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}