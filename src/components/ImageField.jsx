import { useRef, useState } from 'react'
import { uploadImage, MAX_IMAGE_MB } from '../api/storageApi'
import ImageWithFallback from './ImageWithFallback'
import { useToast } from '../context/ToastContext'
import './ImageField.css'

/**
 * Image input — ya URL paste karo, ya file upload (Firebase Storage / demo data URL).
 * @param {string} value       current image URL
 * @param {(url: string) => void} onChange
 * @param {string} folder      Storage folder, e.g. 'restaurants/spice-garden'
 */
export default function ImageField ({ value, onChange, folder = 'misc', label = 'Image' }) {
  const inputRef = useRef(null)
  const { error: toastError, notify } = useToast()
  const [uploading, setUploading] = useState(false)

  async function handleFile (event) {
    const file = event.target.files?.[0]
    event.target.value = '' // same file dobara select ho sake
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
      notify('Image uploaded', 'success')
    } catch (err) {
      toastError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fz-field fz-field--full">
      <span className="fz-label">{label} (max {MAX_IMAGE_MB} MB)</span>

      <div className="fz-image-field">
        <div className="fz-image-field__preview">
          {value ? <ImageWithFallback src={value} alt="" seed={folder} /> : <span className="fz-image-field__empty">No image</span>}
        </div>

        <div className="fz-image-field__controls">
          <input
            className="fz-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://… ya upload karein"
          />
          <div className="fz-image-field__actions">
            <button
              type="button"
              className="fz-btn fz-btn--subtle fz-btn--sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            {value && (
              <button type="button" className="fz-link-danger" onClick={() => onChange('')}>
                Remove
              </button>
            )}
          </div>
          <p className="fz-xs fz-muted">
            File Cloud Storage me upload hoti hai aur link Firestore me save hota hai (rules: admin only).
            Firebase Cloud Storage Blaze plan par available hai — nahi ho to image data URL me save ho
            jayegi (app kahin nahi tooti).
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}
