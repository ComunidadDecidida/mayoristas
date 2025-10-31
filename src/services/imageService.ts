import { supabase } from '../lib/supabase';

export interface UploadImageResult {
  url: string;
  filename: string;
}

export interface ImageFile {
  file: File;
  preview: string;
}

export const imageService = {
  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Formato no válido. Use JPG, PNG o WebP' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'La imagen debe ser menor a 2MB' };
    }

    return { valid: true };
  },

  /**
   * Convert file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Upload image to server via Edge Function
   */
  async uploadImage(
    file: File,
    folder: 'products' | 'banners' | 'brands' | 'categories'
  ): Promise<UploadImageResult> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const base64 = await this.fileToBase64(file);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.functions.invoke('upload-image', {
      body: {
        image: base64,
        folder,
        filename,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Error al subir imagen');

    return {
      url: data.url,
      filename: data.filename,
    };
  },

  /**
   * Delete image from server
   */
  async deleteImage(url: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-image', {
      body: { url },
    });

    if (error) throw error;
  },

  /**
   * Create preview URL for file
   */
  createPreview(file: File): string {
    return URL.createObjectURL(file);
  },

  /**
   * Revoke preview URL
   */
  revokePreview(url: string): void {
    URL.revokeObjectURL(url);
  },

  /**
   * Get full image URL
   */
  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return path;
    return `/${path}`;
  },
};
