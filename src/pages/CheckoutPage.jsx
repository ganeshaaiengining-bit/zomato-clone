import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { PAYMENT_MODES } from '../data/seed'
import { EmptyState, Spinner } from '../components/ui'
import { formatCurrency } from '../utils/format'
import './CheckoutPage.css'

const EMPTY_ADDRESS = {
  name: '',
  phone: '',
  line1: '',
  landmark: '',
  city: 'Bengaluru',
  pincode: '',
}

export default function CheckoutPage () {
  const api = useApi()
  const { user } = useAuth()
  const { items, totals, restaurant, clearCart } = useCart()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, name: user?.name || '' })
  const [paymentMode, setPaymentMode] = useState('upi')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])

  // saved addresses load (profile)
  useEffect(() => {
    let active = true
    api
      .getProfile(user.uid)
      .then((profile) => {
        if (active && profile?.addresses) setSavedAddresses(profile.addresses)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [api, user.uid])

  function setField (key) {
    return (event) => setAddress((current) => ({ ...current, [key]: event.target.value }))
  }

  const errors = {
    name: !address.name.trim() ? 'Name required' : '',
    phone: /^(\+?\d[\d\s-]{7,14})$/.test(address.phone.trim()) ? '' : 'Valid phone number daalein',
    line1: !address.line1.trim() ? 'Flat / house no. required' : '',
    pincode: /^\d{6}$/.test(address.pincode.trim()) ? '' : '6 digit pincode',
  }
  const isValid = Object.values(errors).every((value) => !value)

  async function placeOrder (event) {
    event.preventDefault()
    if (!isValid) {
      toastError('Address details check karein')
      return
    }
    if (!restaurant) return

    setPlacing(true)
    try {
      const order = await api.createOrder({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        restaurantId: restaurant.id || items[0]?.restaurantId || 'unknown',
        restaurantName: restaurant.name || items[0]?.restaurantName || 'Restaurant',
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          veg: item.veg,
        })),
        totals,
        address,
        note: note.trim(),
        paymentMode,
      })

      // address save for next time
      const profile = (await api.getProfile(user.uid)) || {}
      const addresses = [address, ...(profile.addresses || []).filter((a) => a.line1 !== address.line1)].slice(0, 5)
      await api.saveProfile(user.uid, { name: user.name, email: user.email, addresses })

      clearCart()
      success(`Order placed! ID ${order.id}`)
      navigate('/orders', { state: { placedOrderId: order.id } })
    } catch (err) {
      toastError(err.message || 'Order place nahi hua')
    } finally {
      setPlacing(false)
    }
  }

  if (!items.length) {
    return (
      <div className="fz-container fz-page">
        <EmptyState
          icon="🧾"
          title="Nothing to checkout"
          message="Cart me kuch add karein."
          action={
            <button className="fz-btn fz-btn--primary" onClick={() => navigate('/search')}>
              Browse restaurants
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="fz-container fz-page">
      <h1 className="fz-h1">Checkout</h1>

      <form className="fz-checkout" onSubmit={placeOrder}>
        <div className="fz-checkout__main">
          {/* ------------------------------------------------- address */}
          <section className="fz-card fz-checkout__card">
            <h2>Delivery address</h2>

            {savedAddresses.length > 0 && (
              <div className="fz-saved-addresses">
                {savedAddresses.map((saved) => (
                  <button
                    key={saved.line1}
                    type="button"
                    className={`fz-saved-address ${address.line1 === saved.line1 ? 'is-active' : ''}`}
                    onClick={() => setAddress(saved)}
                  >
                    <strong>{saved.name}</strong>
                    <span>
                      {saved.line1}
                      {saved.landmark ? `, ${saved.landmark}` : ''} — {saved.city} {saved.pincode}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="fz-form-grid">
              <label className="fz-field">
                <span className="fz-label">Full name</span>
                <input className="fz-input" value={address.name} onChange={setField('name')} />
                {errors.name && <small className="fz-error">{errors.name}</small>}
              </label>

              <label className="fz-field">
                <span className="fz-label">Phone number</span>
                <input
                  className="fz-input"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  value={address.phone}
                  onChange={setField('phone')}
                />
                {errors.phone && <small className="fz-error">{errors.phone}</small>}
              </label>

              <label className="fz-field fz-field--full">
                <span className="fz-label">Flat / House no., Building, Street</span>
                <input className="fz-input" value={address.line1} onChange={setField('line1')} />
                {errors.line1 && <small className="fz-error">{errors.line1}</small>}
              </label>

              <label className="fz-field">
                <span className="fz-label">Landmark (optional)</span>
                <input className="fz-input" value={address.landmark} onChange={setField('landmark')} />
              </label>

              <label className="fz-field">
                <span className="fz-label">City</span>
                <input className="fz-input" value={address.city} onChange={setField('city')} />
              </label>

              <label className="fz-field">
                <span className="fz-label">Pincode</span>
                <input
                  className="fz-input"
                  inputMode="numeric"
                  maxLength={6}
                  value={address.pincode}
                  onChange={setField('pincode')}
                />
                {errors.pincode && <small className="fz-error">{errors.pincode}</small>}
              </label>
            </div>
          </section>

          {/* ------------------------------------------------- payment */}
          <section className="fz-card fz-checkout__card">
            <h2>Payment method</h2>
            <div className="fz-payment-options">
              {PAYMENT_MODES.map((mode) => (
                <label key={mode.id} className={`fz-payment ${paymentMode === mode.id ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={mode.id}
                    checked={paymentMode === mode.id}
                    onChange={() => setPaymentMode(mode.id)}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>

            <label className="fz-field fz-field--full" style={{ marginTop: 16 }}>
              <span className="fz-label">Note for the restaurant (optional)</span>
              <input
                className="fz-input"
                placeholder="Less spicy, extra chutney…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          </section>
        </div>

        {/* ---------------------------------------------------- summary */}
        <aside className="fz-card fz-bill">
          <h2>Order summary</h2>
          <p className="fz-muted fz-small">{restaurant?.name}</p>

          <ul className="fz-order-items">
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} × {item.qty}
                </span>
                <strong>{formatCurrency(item.price * item.qty)}</strong>
              </li>
            ))}
          </ul>

          <hr className="fz-divider" />

          <dl>
            <div>
              <dt>Item total</dt>
              <dd>{formatCurrency(totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery + taxes</dt>
              <dd>{formatCurrency(totals.deliveryFee + totals.taxes)}</dd>
            </div>
            <div className="fz-bill__discount">
              <dt>Discount</dt>
              <dd>− {formatCurrency(totals.discount)}</dd>
            </div>
            <div className="fz-bill__total">
              <dt>Pay {paymentMode.toUpperCase()}</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>

          <button className="fz-btn fz-btn--primary fz-btn--block" type="submit" disabled={placing || !isValid}>
            {placing ? <Spinner size={16} /> : `Place order · ${formatCurrency(totals.total)}`}
          </button>
        </aside>
      </form>
    </div>
  )
}
