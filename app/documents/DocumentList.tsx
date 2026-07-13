"use client";

import { useState, useEffect } from "react";
import { 
    FaFilePdf, 
    FaFileWord, 
    FaFileExcel, 
    FaFileAlt, 
    FaDownload, 
    FaEye,
    FaFileImage,
    FaFile 
} from "react-icons/fa";

interface Document {
    id: number;
    module_id: number;
    module_type: string;
    title: string;
    sub_title: string;
    description: string;
    file_url: string;
    file_type: string;
    is_pdf: boolean;
    is_image: boolean;
    is_document: boolean;
    created_at: string;
}

interface DocumentListProps {
    moduleId: number;
    moduleType?: string;
    title?: string;
    limit?: number;
}

export default function DocumentList({ 
    moduleId, 
    moduleType = "document",
    title = "Documents",
    limit = 10
}: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/documents?module_id=${moduleId}&module_type=${moduleType}&limit=${limit}`
                );
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || "Failed to fetch documents");
                }

                setDocuments(data.data || []);
            } catch (err: any) {
                setError(err.message || "Failed to load documents");
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };

        if (moduleId) {
            fetchDocuments();
        }
    }, [moduleId, moduleType, limit]);

    const getFileIcon = (doc: Document) => {
        if (doc.is_pdf) return <FaFilePdf className="h-5 w-5 text-red-500" />;
        if (doc.file_type === 'word') return <FaFileWord className="h-5 w-5 text-blue-500" />;
        if (doc.file_type === 'excel') return <FaFileExcel className="h-5 w-5 text-green-500" />;
        if (doc.is_image) return <FaFileImage className="h-5 w-5 text-purple-500" />;
        return <FaFile className="h-5 w-5 text-gray-500" />;
    };

    const getFileTypeLabel = (doc: Document) => {
        if (doc.is_pdf) return 'PDF';
        if (doc.file_type === 'word') return 'Word';
        if (doc.file_type === 'excel') return 'Excel';
        if (doc.is_image) return 'Image';
        return 'File';
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                    <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
                {error}
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
                <FaFileAlt className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No documents available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {title && (
                <h3 className="text-lg font-semibold text-[#192334] flex items-center gap-2">
                    <FaFileAlt className="h-4 w-4 text-[#5B7FBF]" />
                    {title}
                    <span className="text-sm font-normal text-gray-400">
                        ({documents.length})
                    </span>
                </h3>
            )}

            <div className="space-y-2">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:border-[#5B7FBF]/30"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {getFileIcon(doc)}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#192334] truncate">
                                    {doc.title}
                                </p>
                                {doc.sub_title && (
                                    <p className="text-sm text-gray-500 truncate">{doc.sub_title}</p>
                                )}
                                {doc.description && (
                                    <p className="text-xs text-gray-400 line-clamp-1">
                                        {doc.description}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                {getFileTypeLabel(doc)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                title="View"
                            >
                                <FaEye className="h-4 w-4" />
                            </a>
                            <a
                                href={doc.file_url}
                                download
                                className="rounded-lg bg-[#192334] p-2 text-white hover:bg-[#2a3a4a] transition-colors"
                                title="Download"
                            >
                                <FaDownload className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}