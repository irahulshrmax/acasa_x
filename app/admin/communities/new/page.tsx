// app/admin/communities/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminCommunityCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        city_id: '',
        state_id: '',
        country_id: '',
        description: '',
        img: '',
        status: 1,
        featured: 0,
        latitude: '',
        longitude: '',
        seo_title: '',
        seo_keywork: '',
        seo_description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ─── Fetch filters ──────────────────────────────────────────────────────
    useEffect(() => {
        async function fetchFilters() {
            try {
                const res = await fetch('/api/v1/admin/communities?filters=true', {
                    credentials: 'include',
                });
                const data = await res.json();
                if (data.success) {
                    setCities(data.data.cities || []);
                    setCountries(data.data.countries || []);
                    setStates(data.data.states || []);
                }
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        }
        fetchFilters();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const generateSlug = () => {
        if (!formData.name) {
            toast.error('Please enter a name first');
            return;
        }
        const slug = formData.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setFormData(prev => ({ ...prev, slug }));
        toast.success('Slug generated!');
    };

    const validate = (): boolean => {
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
        if (!validate()) {
            toast.error('Please fix all errors');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Community created!');
                setTimeout(() => router.push('/admin/communities'), 1000);
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                    toast.error('Please fix all errors');
                } else {
                    toast.error(data.message || 'Failed to create community');
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

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
                        <h1 className="text-2xl font-semibold text-neutral-900">Create Community</h1>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={18} />}
                        {loading ? 'Saving...' : 'Create'}
                    </button>
                </div>

                {/* Form */}
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
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium text-neutral-700">Slug</label>
                                <button
                                    type="button"
                                    onClick={generateSlug}
                                    className="text-xs text-neutral-500 hover:text-neutral-900"
                                >
                                    Generate
                                </button>
                            </div>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="auto-generated"
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
                                value={formData.state_id}
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
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="e.g., 25.2048"
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Longitude</label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="e.g., 55.2708"
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Image URL</label>
                            <input
                                type="text"
                                name="img"
                                value={formData.img}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Community description..."
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
                                        value={formData.seo_title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-600 mb-1.5">SEO Keywords</label>
                                    <input
                                        type="text"
                                        name="seo_keywork"
                                        value={formData.seo_keywork}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-neutral-600 mb-1.5">SEO Description</label>
                                    <textarea
                                        name="seo_description"
                                        value={formData.seo_description}
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