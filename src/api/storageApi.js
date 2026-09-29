/* =============================================================================
   Image upload helper (Cloud Storage ya fallback)

   Cloud Storage  → file → Firebase Storage → download URL (Firestore me save)
   Storage nahi   → file → data URL (chhoti images; browser me hi chalti hai)

   NOTE: Firebase Cloud Storage sirf Blaze (billing) plan par available hai.
   Spark (free) plan par storage bucket nahi banta — us case me hum data URL
   fallback use karte hain, taaki app na toote aur console bhi clean rahe.
   Blaze upgrade ke baad yahi code automatically Storage par switch ho jayega
   (koi code change nahi).

   Recommended Storage paths:
     restaurants/{restaurantId}/{timestamp}-file.jpg
     dishes/{timestamp}-file.jpg
   ========================================================================== */

import { isFirebaseConfigured } from '../config/firebase'

export const MAX_IMAGE_MB = 3

// Upload ka last known result — UI hint ke liye (true = Storage, false = data URL)
let lastUploadUsedStorage = null

/**
 * @param {File} file
 * @param {string} folder  e.g. 'restaurants/spice-garden' ya 'dishes'
 * @returns {Promise<string>} image URL jo Firestore me save kiya ja sakta hai
 */
export async function uploadImage (file, folder = 'misc') {
  if (!file) throw new Error('No file selected')
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed')
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`Image ${MAX_IMAGE_MB} MB se chhoti honi chahiye`)
  }

  if (isFirebaseConfigured) {
    try {
      // Firebase SDK sirf tab load hota hai jab actually upload karna ho
      const [{ ref, uploadBytes, getDownloadURL }, { getFirebase }] = await Promise.all([
        import('firebase/storage'),
        import('../config/firebase'),
      ])

      const { storage } = getFirebase()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const snap = await uploadBytes(ref(storage, `${folder}/${Date.now()}-${safeName}`), file, {
        contentType: file.type,
      })
      lastUploadUsedStorage = true
      return getDownloadURL(snap.ref)
    } catch (err) {
      // Storage unavailable (bucket nahi hai / Blaze plan nahi / network) —
      // data URL fallback. Rules ya bucket hone par agle upload se Storage par jayega.
      if (err?.code === 'storage/unauthorized' || err?.code === 'storage/bucket-not-found') {
        lastUploadUsedStorage = false
      }
    }
  }

  lastUploadUsedStorage = false
  return readAsDataUrl(file)
}

/** Pichla upload Cloud Storage gaya ya data URL me gaya (UI hint ke liye) */
export function lastUploadUsedCloudStorage () {
  return lastUploadUsedStorage
}

/** FileReader → data URL (Storage available hone par fallback) */
export function readAsDataUrl (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}
