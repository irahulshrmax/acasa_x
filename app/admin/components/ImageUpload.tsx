'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    Trash2, 
    AlertCircle, 
    Loader2, 
    Check, 
    Image as ImageIcon,
    X,
    ZoomIn 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    onRemove?: () => void;
    existingImage?: string;
    label?: string;
    required?: boolean;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    className?: string;
    showPreview?: boolean;
    previewHeight?: number;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_MAX_SIZE = 5;

export function ImageUpload({
    onUpload,
    onRemove,
    existingImage = '',
    label = 'Featured Image',
    required = false,
    maxSizeMB = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    className = '',
    showPreview = true,
    previewHeight = 220,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageUrl, setImageUrl] = useState<string | null>(existingImage || null);
    const [preview, setPreview] = useState<string | null>(existingImage || null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showFullPreview, setShowFullPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!acceptedTypes.includes(file.type)) {
            const allowed = acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
            return `Invalid file type. Allowed: ${allowed}`;
        }
        if (file.size === 0) {
            return 'File is empty.';
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File too large. Max ${maxSizeMB}MB`;
        }
        return null;
    };

    const readFileAsPreview = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = useCallback(async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            toast.error(validationError);
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const previewUrl = await readFileAsPreview(file);
            setPreview(previewUrl);

            const formData = new FormData();
            formData.append('image', file);

            const xhr = new XMLHttpRequest();
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.open('POST', '/api/v1/admin/blogs/upload');
                xhr.withCredentials = true;

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(progress);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            resolve(data);
                        } catch {
                            reject(new Error('Invalid response from server'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(formData);
            });

            const data = await uploadPromise as any;

            if (data.success && data.data) {
                const url = data.data.url || data.data.full_url;
                setImageUrl(url);
                setPreview(url);
                onUpload(url);
                toast.success('Image uploaded successfully!');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err: any) {
            const message = err?.message || 'Upload failed. Please try again.';
            setError(message);
            toast.error(message);
            setPreview(existingImage || null);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [onUpload, maxSizeMB, acceptedTypes, existingImage]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemove = () => {
        setImageUrl(null);
        setPreview(null);
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onRemove) {
            onRemove();
        }
        onUpload('');
        toast.success('Image removed');
    };

    const getFileSizeLabel = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-neutral-900">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                        Max {maxSizeMB}MB
                    </span>
                    {imageUrl && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <Trash2 size={13} />
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
            />

            <AnimatePresence mode="wait">
                {imageUrl && preview && showPreview ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50"
                    >
                        <div 
                            className="relative cursor-pointer"
                            style={{ height: previewHeight }}
                            onClick={() => setShowFullPreview(true)}
                        >
                            <img 
                                src={preview} 
                                alt="Uploaded preview" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2.5">
                                    <ZoomIn size={18} className="text-white" />
                                    <span className="text-sm text-white font-medium">Preview</span>
                                </div>
                            </div>

                            <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-red-50 transition-all shadow-lg hover:scale-105"
                                    title="Remove image"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-neutral-50 transition-all shadow-lg hover:scale-105"
                                    title="Change image"
                                >
                                    <Upload size={16} className="text-neutral-600" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-4 py-2.5 bg-white border-t border-neutral-100">
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <Check size={14} className="text-emerald-500" />
                                <span>Uploaded</span>
                            </div>
                            <span className="text-xs text-neutral-300">|</span>
                            <span className="text-xs text-neutral-500 truncate flex-1">
                                {imageUrl}
                            </span>
                        </div>
                    </motion.div>
                ) : uploading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-neutral-300 rounded-xl p-10 text-center bg-neutral-50/50"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={40} className="text-neutral-400 animate-spin" />
                            <div>
                                <p className="text-sm font-medium text-neutral-900">Uploading...</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {uploadProgress > 0 ? `${uploadProgress}%` : 'Please wait'}
                                </p>
                            </div>
                            {uploadProgress > 0 && (
                                <div className="w-64 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-neutral-900 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            isDragging 
                                ? 'border-neutral-900 bg-neutral-50 scale-[1.02]' 
                                : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className={`p-4 rounded-full transition-all ${isDragging ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                <Upload size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-700">
                                    {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
                                </p>
                                <p className="text-xs text-neutral-400 mt-1.5">
                                    {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max {maxSizeMB}MB
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
                >
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-red-600 hover:text-red-700 font-medium mt-1 underline"
                        >
                            Try again
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}

            {showFullPreview && preview && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowFullPreview(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={preview} 
                            alt="Full preview" 
                            className="w-full h-full max-h-[80vh] object-contain"
                        />
                        <button
                            onClick={() => setShowFullPreview(false)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5">
                            <span className="text-sm text-white truncate">{imageUrl}</span>
                            <button
                                onClick={handleRemove}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}