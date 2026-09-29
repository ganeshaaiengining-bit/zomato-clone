import { useState } from 'react'

const FALLBACK = (seed = 'food') =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`

/**
 * Image with graceful fallback
 * - loading placeholder (shimmer) + fade-in
 * - onError par auto fallback (picsum) — koi broken image nahi dikhega
 * - `key` ke through src change par state apne aap reset hoti hai
 */
export default function ImageWithFallback (props) {
  return <Img {...props} key={props.src || props.seed} />
}

function Img ({ src, alt = '', seed = 'food', className = '', aspect, loading = 'lazy', ...rest }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const current = src && !failed ? src : FALLBACK(seed)

  return (
    <span
      className={`fz-img ${className}`}
      style={aspect ? { aspectRatio: aspect } : undefined}
      data-loaded={loaded}
    >
      <img
        src={current}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true) // asli image fail hui → placeholder try karo
          else setLoaded(true) // placeholder bhi fail → plain background
        }}
        {...rest}
      />
    </span>
  )
}
