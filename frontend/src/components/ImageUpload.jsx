import React, { useState } from 'react';
import { FiUpload } from 'react-icons/fi';

const ImageUpload = ({ onImageUpload }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onImageUpload(file);
        }
    };

    return (
        <div className="upload-image-card">
            <label className="relative flex flex-col items-center justify-center w-full h-full cursor-pointer">
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                
                {previewUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                            src={previewUrl} 
                            alt="Token preview" 
                            className="w-full h-full object-contain p-2 rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <div className="text-white text-center">
                                <FiUpload className="mx-auto text-2xl mb-2" />
                                <p className="text-sm">Click to change image</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <FiUpload className="text-gray-300 text-3xl mb-3" />
                        <p className="text-sm text-gray-300">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF (MAX. 800x800px)
                        </p>
                    </div>
                )}
            </label>
        </div>
    );
};

export default ImageUpload; 