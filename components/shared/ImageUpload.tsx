
import React, { useState, useEffect } from 'react';
import { App, Upload, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';

// Ant Design types
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

interface ImageUploadProps {
    value?: string[];
    onChange?: (fileList: string[]) => void;
    maxCount?: number;
    bucket?: string;
}

const getFileUrl = (file: UploadFile): string | undefined => {
    // After a successful customRequest, the URL is in response.url
    return file.url || (file.response as { url: string })?.url;
};

// Extracts the file path from a full Supabase public URL
// e.g., https://.../public/products/public/some-user/image.png -> public/some-user/image.png
const getPathFromUrl = (url: string, bucket: string): string => {
    try {
        const urlObject = new URL(url);
        const searchString = `/public/${bucket}/`;
        const startIndex = urlObject.pathname.indexOf(searchString);
        if (startIndex === -1) {
            console.warn("Could not extract path from URL:", url);
            return '';
        }
        return decodeURIComponent(urlObject.pathname.substring(startIndex + searchString.length));
    } catch (error) {
        console.error("Invalid URL for path extraction:", url, error);
        return '';
    }
};

const ImageUploadComponent: React.FC<ImageUploadProps> = ({ value = [], onChange, maxCount = 5, bucket = 'products' }) => {
    const { notification } = App.useApp();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Sync from form value (value prop) to internal fileList state
    useEffect(() => {
        const formUrls = new Set(value);
        const stateUrls = new Set(fileList.map(getFileUrl).filter(Boolean));

        // If the sets of URLs are different, sync the state from the prop
        if (formUrls.size !== stateUrls.size || ![...formUrls].every(url => stateUrls.has(url))) {
            const newFileList = value.map((url, index) => ({
                uid: `${url}-${index}`, // Make UID more unique to the URL
                name: url.substring(url.lastIndexOf('/') + 1),
                status: 'done' as const,
                url: url,
            }));
            setFileList(newFileList);
        }
    }, [value, fileList]);

    const handleCancel = () => setPreviewOpen(false);

    const handlePreview = async (file: UploadFile) => {
        const url = getFileUrl(file);
        if (!url && !file.preview) {
            return;
        }
        setPreviewImage(url || (file.preview as string));
        setPreviewOpen(true);
        setPreviewTitle(file.name || url!.substring(url!.lastIndexOf('/') + 1));
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        
        const uploadedUrls = newFileList
            .filter(file => file.status === 'done' && getFileUrl(file))
            .map(file => getFileUrl(file)!);
        
        onChange?.(uploadedUrls);
    };

    const handleRemove = async (file: UploadFile): Promise<boolean> => {
        const url = getFileUrl(file);
        if (!url) return true; // File wasn't uploaded anyway

        const path = getPathFromUrl(url, bucket);
        if (!path) {
            notification.error({ message: 'Error removing file', description: 'Could not determine file path to delete.' });
            return false;
        }

        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) throw error;
            notification.success({ message: 'Image removed successfully.' });
            return true;
        } catch (error: any) {
            notification.error({ message: 'Error removing file from storage', description: error.message });
            return false;
        }
    };

    const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError, onProgress }) => {
        const rcFile = file as RcFile;
        // Create a more unique file name to avoid collisions
        const fileName = `${Date.now()}-${rcFile.name.replace(/\s/g, '_')}`;
        const filePath = `public/${fileName}`;

        try {
            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

            if (!publicUrlData.publicUrl) {
                throw new Error('Could not get public URL for uploaded file.');
            }

            if (onSuccess) {
                onSuccess({ url: publicUrlData.publicUrl });
            }
        } catch (err: any) {
            notification.error({ message: `Upload failed for ${rcFile.name}`, description: err.message });
            if (onError) onError(err);
        }
    };
    
    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );
    
    return (
        <>
            <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleChange}
                onRemove={handleRemove}
                customRequest={customRequest}
                accept="image/*"
                multiple
            >
                {fileList.length >= maxCount ? null : uploadButton}
            </Upload>
            <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
                <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </>
    );
};


const ImageUpload: React.FC<ImageUploadProps> = (props) => (
    <App>
        <ImageUploadComponent {...props} />
    </App>
);

export default ImageUpload;
