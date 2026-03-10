import React, { useRef, useState, useEffect } from'react';
import './MediaUpload.css';

const MediaUpload = ({ onMediaSelect, disabled }) => {
 const fileInputRef = useRef(null);
 const [uploading, setUploading] = useState(false);
 const [localPreview, setLocalPreview] = useState(null);
 
 // Clear local preview when disabled becomes false (after sending)
 useEffect(() => {
   if (!disabled) {
      setLocalPreview(null);
    }
  }, [disabled]);

const handleFileClick = () => {
  if (!disabled && !uploading) {
     fileInputRef.current?.click();
   }
 };

const handleFileChange = async (e) => {
 const file = e.target.files[0];
 if (!file) return;

   // Validate file type
const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp3'];
 if (!validTypes.includes(file.type)) {
  alert('Invalid file type. Please upload an image, video, or audio file.');
  return;
   }

   // Validate file size (max 10MB)
 if (file.size > 10 * 1024 * 1024) {
  alert('File is too large. Maximum size is 10MB.');
  return;
   }

 try {
     setUploading(true);
     
     // Create preview
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onloadend = () => {
       setLocalPreview(reader.result);
      };
    reader.readAsDataURL(file);
     }

     // Convert file to base64 for sending
  const base64 = await convertFileToBase64(file);
     
     // Send to parent component
     onMediaSelect({
       file,
       base64,
       type: getMediaType(file.type),
       name: file.name,
       size: file.size
     });

     // Reset input
     e.target.value = '';
   } catch (error) {
 console.error('Error processing file:', error);
  alert('Failed to process file. Please try again.');
   } finally {
     setUploading(false);
   }
 };

 const convertFileToBase64 = (file) => {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.onload = () => resolve(reader.result);
     reader.onerror = reject;
     reader.readAsDataURL(file);
    });
  };

 const getMediaType = (mimeType) => {
   if (mimeType.startsWith('image/')) return 'image';
   if (mimeType.startsWith('video/')) return 'video';
   if (mimeType.startsWith('audio/')) return 'audio';
   return 'file';
  };

 return(
   <div className="media-upload-container">
     <input
     ref={fileInputRef}
       type="file"
       accept="image/*,video/*,audio/*"
       onChange={handleFileChange}
     style={{ display: 'none' }}
       disabled={disabled || uploading}
     />
     
     <button
       type="button"  // ← Prevent form submission
       className={`media-upload-btn ${uploading ? 'uploading' : ''}`}
       onClick={handleFileClick}
       disabled={disabled || uploading}
       title="Attach media"
     >
       {uploading ? (
         <span className="upload-spinner">🔄</span>
       ) : (
         <span>📎</span>
       )}
     </button>

     {localPreview && (
       <div className="media-preview">
         <img src={localPreview} alt="Preview" className="preview-image" />
         <button className="remove-preview" onClick={() => setLocalPreview(null)}>✕</button>
       </div>
     )}
   </div>
 );
};

export default MediaUpload;
