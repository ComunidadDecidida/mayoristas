import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { imageService, ImageFile } from '../../services/imageService';
import { Button } from './Button';

interface ImageUploaderProps {
  folder: 'products' | 'banners' | 'brands' | 'categories';
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  label?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export function ImageUploader({
  folder,
  onUploadComplete,
  currentImage,
  label = 'Subir imagen',
  multiple = false,
  maxFiles = 1,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const newImages: ImageFile[] = [];

      for (const file of fileArray) {
        const validation = imageService.validateImage(file);
        if (!validation.valid) {
          setError(validation.error || 'Error de validación');
          continue;
        }

        if (!multiple && newImages.length >= 1) break;
        if (images.length + newImages.length >= maxFiles) break;

        newImages.push({
          file,
          preview: imageService.createPreview(file),
        });
      }

      setImages((prev) => [...prev, ...newImages]);
      setError('');
    },
    [images.length, multiple, maxFiles]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      imageService.revokePreview(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUpload = async () => {
    if (images.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const image of images) {
        const result = await imageService.uploadImage(image.file, folder);
        onUploadComplete(result.url);
        imageService.revokePreview(image.preview);
      }
      setImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleChange}
          className="hidden"
        />

        <div className="space-y-2">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Haz click para subir
            </button>{' '}
            o arrastra y suelta
          </div>
          <p className="text-xs text-gray-500">
            JPG, PNG o WebP (máx. 2MB)
          </p>
        </div>
      </div>

      {/* Current Image */}
      {currentImage && images.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Imagen actual:</p>
          <div className="relative inline-block">
            <img
              src={imageService.getImageUrl(currentImage)}
              alt="Imagen actual"
              className="h-32 w-32 object-cover rounded-lg border border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Preview Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {images.length === 1 ? 'Vista previa:' : `${images.length} imágenes:`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="h-32 w-full object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir {images.length > 1 ? `${images.length} imágenes` : 'imagen'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
