// utils/imageHelper.ts

/**
 * Processes an image file client-side before uploading.
 * Resizes the image to a maximum dimension and compresses it.
 * @param file The original image file.
 * @param maxSize The maximum width or height of the processed image (default: 1024px).
 * @param quality The quality of the output JPEG image (0.0 to 1.0, default: 0.8).
 * @returns A promise that resolves with the processed image File object.
 */
export const processImage = (file: File, maxSize = 1024, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate the new dimensions
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to a blob with specified quality
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas to Blob conversion failed'));
                        }
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
                        const newFile = new File([blob], newFileName, {
                            type: `image/jpeg`,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
