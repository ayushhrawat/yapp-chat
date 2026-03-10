import React, { useState } from 'react';
import './MediaMessage.css';

const MediaMessage = ({ content, type, fileName, fileSize }) => {
 const [isExpanded, setIsExpanded] = useState(false);
 const [loading, setLoading] = useState(true);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
 };

const handleDownload = () => {
  try {
    const link = document.createElement('a');
     link.href = content;
     link.download = fileName || `media_${Date.now()}`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download media. Please try again.');
    }
  };

const handleView = () => {
   setIsExpanded(true);
 };

const handleCloseExpanded = () => {
   setIsExpanded(false);
 };

const renderMedia = () => {
   switch (type) {
     case 'image':
      return (
         <div className="media-content image">
           {loading && <div className="media-loading">Loading...</div>}
           <img 
             src={content} 
            alt="Shared media" 
             onLoad={() => setLoading(false)}
            style={{ display: loading ? 'none' : 'block' }}
           />
         </div>
       );
     
     case 'video':
      return (
         <div className="media-content video">
           <video controls onLoadedMetadata={() => setLoading(false)}>
             <source src={content} />
             Your browser does not support the video tag.
           </video>
         </div>
       );
     
     case 'audio':
      return (
         <div className="media-content audio">
           <audio controls onLoadedMetadata={() => setLoading(false)}>
             <source src={content} />
             Your browser does not support the audio tag.
           </audio>
         </div>
       );
     
     default:
      return (
         <div className="media-content file">
           <div className="file-icon">📄</div>
           <div className="file-info">
             <span className="file-name">{fileName || 'Unknown file'}</span>
             <span className="file-size">{formatFileSize(fileSize)}</span>
           </div>
         </div>
       );
   }
 };

 return(
   <>
     <div className="media-message" onClick={handleView}>
       {renderMedia()}
       <div className="media-actions">
         <button className="download-btn" onClick={(e) => {
           e.stopPropagation();
           handleDownload();
         }} title="Download">
           ⬇️
         </button>
       </div>
     </div>

     {isExpanded && (type === 'image' || type === 'video') && (
       <div className="media-expanded-overlay" onClick={handleCloseExpanded}>
         <div className="media-expanded-content" onClick={(e) => e.stopPropagation()}>
           <button className="close-expanded" onClick={handleCloseExpanded}>✕</button>
           {type === 'image' && (
             <img src={content} alt="Expanded view" />
           )}
           {type === 'video' && (
             <video controls autoPlay>
               <source src={content} />
             </video>
           )}
           <div className="expanded-info">
             <p className="expanded-name">{fileName || 'Media'}</p>
             <p className="expanded-size">{formatFileSize(fileSize)}</p>
             <button className="expanded-download" onClick={handleDownload}>
               ⬇️ Download
             </button>
           </div>
         </div>
       </div>
     )}
   </>
  );
};

export default MediaMessage;
