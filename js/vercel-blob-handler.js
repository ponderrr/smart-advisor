/**
 * @param {Blob|File} imageBlob - The image blob or file to upload
 * @param {string} userId - The user ID to associate with the uploaded image
 * @returns {Promise<string>} The URL of the uploaded image
 */

export async function uploadImageToVercelBlob(imageBlob, userId) {
    try {
      const fileName = `${userId}_${Date.now()}.jpg`;
      
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      const response = await fetch(`/api/upload-profile-picture?filename=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      throw error;
    }
  }
  
  /**
   * Delete an image from Vercel Blob Storage
   * @param {string} url - The URL of the image to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  export async function deleteImageFromVercelBlob(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      const response = await fetch(`/api/delete-profile-picture?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting from Vercel Blob:', error);
      throw error;
    }
  }