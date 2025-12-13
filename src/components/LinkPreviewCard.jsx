import React from 'react';
import { X } from 'lucide-react';

const LinkPreviewCard = ({ preview, onRemove }) => {
    if (!preview) return null;

    return (
        <div className="relative mt-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col sm:flex-row group">
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"
                >
                    <X size={14} />
                </button>
            )}

            {preview.image && (
                <div className="sm:w-32 h-32 flex-shrink-0 bg-gray-200">
                    <img
                        src={preview.image}
                        alt={preview.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1 truncate">
                    {preview.domain}
                </span>
                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                    {preview.title}
                </h3>
                {preview.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                        {preview.description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LinkPreviewCard;
