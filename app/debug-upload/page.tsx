// app/debug-upload/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DebugUploadPage() {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [apiStatus, setApiStatus] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Check API Status ──────────────────────────────────────────────
    const checkApiStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/debug/upload', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await res.json();
            setApiStatus(data);
            toast.success('API is alive!');
            console.log('🐛 API Status:', data);
        } catch (error) {
            console.error('API check failed:', error);
            toast.error('API is not responding!');
        }
    }, []);

    // ─── Upload Handler ──────────────────────────────────────────────
    const handleUpload = useCallback(async (file: File) => {
        console.log('🐛 [Frontend] Upload started:', {
            name: file.name,
            type: file.type,
            size: file.size,
            sizeKB: (file.size / 1024).toFixed(2),
            sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        });

        setUploading(true);
        setError(null);
        setDebugInfo(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append('image', file);

            console.log('🐛 [Frontend] Sending request to /api/v1/debug/upload');
            console.log('🐛 [Frontend] FormData:', {
                hasImage: formData.has('image'),
                imageName: file.name,
            });

            const startTime = Date.now();

            const res = await fetch('/api/v1/debug/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const endTime = Date.now();
            console.log('🐛 [Frontend] Response received in:', `${endTime - startTime}ms`);
            console.log('🐛 [Frontend] Response status:', res.status);
            console.log('🐛 [Frontend] Response headers:', {
                'content-type': res.headers.get('content-type'),
                'content-length': res.headers.get('content-length'),
            });

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await res.text();
                console.error('🐛 [Frontend] NON-JSON RESPONSE:', text.substring(0, 500));
                throw new Error(`Server returned ${contentType || 'unknown'} response. Check server logs.`);
            }

            const data = await res.json();
            console.log('🐛 [Frontend] Response data:', data);

            if (data.success) {
                setImageUrl(data.data.url);
                setDebugInfo(data);
                toast.success('Upload successful! 🎉');
                console.log('✅ [Frontend] Upload success:', data.data);
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err: any) {
            console.error('❌ [Frontend] Upload error:', err);
            setError(err.message || 'Failed to upload image');
            toast.error(err.message || 'Upload failed');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const removeImage = () => {
        setImageUrl(null);
        setPreview(null);
        setError(null);
        setDebugInfo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-2xl mx-auto">
                {/* ─── Header ────────────────────────────────────────── */}
                <div className="bg-white rounded-xl p-6 border shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">🐛 Debug Upload</h1>
                            <p className="text-sm text-neutral-500 mt-1">Test image upload - saves to blog folder</p>
                        </div>
                        <button
                            onClick={checkApiStatus}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 text-sm"
                        >
                            Check API
                        </button>
                    </div>

                    {apiStatus && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                            <p className="text-emerald-700 font-medium">✅ API Status: {apiStatus.message}</p>
                            <p className="text-xs text-emerald-600 mt-1">
                                Upload Dir: {apiStatus.upload_dir}
                            </p>
                            <p className="text-xs text-emerald-600">
                                Max Size: {apiStatus.max_size_mb}MB
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── Upload Area ────────────────────────────────────── */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">📤 Upload Image</h2>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />

                    {imageUrl && preview ? (
                        <div className="relative rounded-xl overflow-hidden border border-neutral-200 group">
                            <img
                                src={preview}
                                alt="Uploaded"
                                className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100"
                                >
                                    Change
                                </button>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle size={14} /> Uploaded
                            </div>
                        </div>
                    ) : uploading ? (
                        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center">
                            <Loader2 className="mx-auto mb-3 animate-spin text-neutral-400" size={48} />
                            <p className="text-sm font-medium text-neutral-600">Uploading...</p>
                            <p className="text-xs text-neutral-400 mt-1">Please wait</p>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                                isDragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400'
                            }`}
                        >
                            <Upload className={`mx-auto mb-3 ${isDragging ? 'text-neutral-900' : 'text-neutral-400'}`} size={48} />
                            <p className="text-sm font-medium text-neutral-600">
                                {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
                            </p>
                            <p className="text-xs text-neutral-400 mt-2">
                                JPG, PNG, WebP, GIF • Max 10MB • Saves to blog folder
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-medium text-red-700">Upload Failed</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Debug Info ────────────────────────────────────── */}
                {debugInfo && (
                    <div className="bg-white rounded-xl p-6 border shadow-sm mt-6">
                        <h3 className="font-semibold text-neutral-900 mb-3">🔍 Debug Info</h3>
                        <div className="bg-neutral-900 text-neutral-100 rounded-lg p-4 overflow-auto max-h-64 text-xs font-mono">
                            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                        </div>
                    </div>
                )}

                {/* ─── Instructions ──────────────────────────────────── */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <h4 className="font-medium text-blue-800 mb-2">📋 Instructions</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>1. Select an image file (JPG, PNG, WebP, GIF)</li>
                        <li>2. Check console (F12) for detailed logs</li>
                        <li>3. Check server PM2 logs: <code className="bg-blue-100 px-2 py-0.5 rounded">pm2 logs acasa</code></li>
                        <li>4. Upload directory: <code className="bg-blue-100 px-2 py-0.5 rounded">public/upload/blogs/</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}