import { useCallback, useMemo, useState } from 'react'
import { useApi } from '../context/DataContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import ImageField from '../components/ImageField'
import ImageWithFallback from '../components/ImageWithFallback'
import { PageLoader, Rating, Spinner } from '../components/ui'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../data/seed'
import { formatCurrency, formatDateTime, slugify } from '../utils/format'
import './AdminPage.css'

/* ------------------------------------------------------------------ helpers */
const toNumber = (value) => Number(value) || 0
const listToString = (value) => (Array.isArray(value) ? value.join(', ') : value || '')

const namesToCategories = (names) =>
  names
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ id: slugify(name) || slugify(`cat-${name}`), name }))

const categoriesToNames = (categories = []) => categories.map((c) => c.name).join(', ')

const BLANK_RESTAURANT = {
  name: '',
  tagline: '',
  cuisines: '',
  rating: 4.5,
  ratingCount: 0,
  priceLevel: 2,
  deliveryTime: 30,
  deliveryFee: 29,
  image: '',
  banner: '',
  address: { line1: '', locality: '', city: 'Bengaluru' },
  isOpen: true,
  isVegOnly: false,
  offerLabel: '',
  offerCode: '',
  categories: 'Starters, Main Course, Desserts, Drinks',
}

const BLANK_DISH = {
  name: '',
  description: '',
  price: 199,
  mrp: 0,
  categoryId: '',
  image: '',
  veg: true,
  spicy: 1,
  bestseller: false,
}

/* ============================================================== restaurant */
function RestaurantForm ({ initial, onCancel, onSubmit, busy }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_RESTAURANT,
    ...initial,
    address: { ...BLANK_RESTAURANT.address, ...(initial?.address || {}) },
  }))

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const setAddress = (key) => (event) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: event.target.value } }))

  return (
    <form
      className="fz-admin-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          cuisines: form.cuisines.split(',').map((c) => c.trim()).filter(Boolean),
          rating: toNumber(form.rating),
          ratingCount: toNumber(form.ratingCount),
          priceLevel: toNumber(form.priceLevel),
          deliveryTime: toNumber(form.deliveryTime),
          deliveryFee: toNumber(form.deliveryFee),
          image: form.image,
          banner: form.banner || form.image,
          address: form.address,
          isOpen: form.isOpen,
          isVegOnly: form.isVegOnly,
          offer: form.offerLabel.trim()
            ? { label: form.offerLabel.trim(), code: form.offerCode.trim().toUpperCase() }
            : null,
          menuCategories: namesToCategories(form.categories),
        })
      }}
    >
      <div className="fz-form-grid">
        <label className="fz-field">
          <span className="fz-label">Restaurant name *</span>
          <input className="fz-input" value={form.name} onChange={set('name')} required />
        </label>

        <label className="fz-field">
          <span className="fz-label">Tagline</span>
          <input className="fz-input" value={form.tagline} onChange={set('tagline')} />
        </label>

        <label className="fz-field fz-field--full">
          <span className="fz-label">Cuisines (comma separated)</span>
          <input
            className="fz-input"
            value={form.cuisines}
            onChange={set('cuisines')}
            placeholder="North Indian, Chinese, Desserts"
          />
        </label>

        <label className="fz-field">
          <span className="fz-label">Rating (0-5)</span>
          <input className="fz-input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={set('rating')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Rating count</span>
          <input className="fz-input" type="number" min="0" value={form.ratingCount} onChange={set('ratingCount')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Price level (1-4)</span>
          <input className="fz-input" type="number" min="1" max="4" value={form.priceLevel} onChange={set('priceLevel')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Delivery time (min)</span>
          <input className="fz-input" type="number" min="10" value={form.deliveryTime} onChange={set('deliveryTime')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Delivery fee (₹, 0 = free)</span>
          <input className="fz-input" type="number" min="0" value={form.deliveryFee} onChange={set('deliveryFee')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Offer label</span>
          <input className="fz-input" value={form.offerLabel} onChange={set('offerLabel')} placeholder="Flat 20% off" />
        </label>

        <label className="fz-field">
          <span className="fz-label">Offer code</span>
          <input className="fz-input" value={form.offerCode} onChange={set('offerCode')} placeholder="SPICE20" />
        </label>

        <label className="fz-field fz-field--full">
          <span className="fz-label">Menu categories (comma separated, order matters)</span>
          <input className="fz-input" value={form.categories} onChange={set('categories')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Address — flat / building</span>
          <input className="fz-input" value={form.address.line1} onChange={setAddress('line1')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Locality</span>
          <input className="fz-input" value={form.address.locality} onChange={setAddress('locality')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">City</span>
          <input className="fz-input" value={form.address.city} onChange={setAddress('city')} />
        </label>

        <label className="fz-check">
          <input type="checkbox" checked={form.isOpen} onChange={set('isOpen')} />
          <span>Open now</span>
        </label>

        <label className="fz-check">
          <input type="checkbox" checked={form.isVegOnly} onChange={set('isVegOnly')} />
          <span>Pure veg</span>
        </label>

        <ImageField
          value={form.image}
          folder={`restaurants/${slugify(form.name) || 'new'}`}
          label="Card image"
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
        />

        <ImageField
          value={form.banner}
          folder={`restaurants/${slugify(form.name) || 'new'}`}
          label="Banner image"
          onChange={(url) => setForm((f) => ({ ...f, banner: url }))}
        />
      </div>

      <div className="fz-admin-form__actions">
        <button type="button" className="fz-btn fz-btn--subtle" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="fz-btn fz-btn--primary" disabled={busy}>
          {busy ? <Spinner size={16} /> : 'Save restaurant'}
        </button>
      </div>
    </form>
  )
}

/* ===================================================================== dish */
function DishForm ({ categories, initial, onCancel, onSubmit, onAddCategory, busy }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_DISH,
    categoryId: categories[0]?.id || '',
    ...initial,
  }))
  const [newCategory, setNewCategory] = useState('')

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form
      className="fz-admin-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          name: form.name.trim(),
          description: form.description.trim(),
          price: toNumber(form.price),
          mrp: toNumber(form.mrp),
          categoryId: form.categoryId,
          image: form.image,
          veg: form.veg,
          spicy: toNumber(form.spicy),
          bestseller: form.bestseller,
        })
      }}
    >
      <div className="fz-form-grid">
        <label className="fz-field fz-field--full">
          <span className="fz-label">Dish name *</span>
          <input className="fz-input" value={form.name} onChange={set('name')} required />
        </label>

        <label className="fz-field fz-field--full">
          <span className="fz-label">Description</span>
          <textarea className="fz-textarea" rows={2} value={form.description} onChange={set('description')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Price (₹) *</span>
          <input className="fz-input" type="number" min="0" value={form.price} onChange={set('price')} required />
        </label>

        <label className="fz-field">
          <span className="fz-label">MRP (0 = no discount)</span>
          <input className="fz-input" type="number" min="0" value={form.mrp} onChange={set('mrp')} />
        </label>

        <label className="fz-field">
          <span className="fz-label">Category</span>
          <select className="fz-select" value={form.categoryId} onChange={set('categoryId')}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="fz-field">
          <span className="fz-label">Spice level (0-4)</span>
          <input className="fz-input" type="number" min="0" max="4" value={form.spicy} onChange={set('spicy')} />
        </label>

        <label className="fz-check">
          <input type="checkbox" checked={form.veg} onChange={set('veg')} />
          <span>Veg</span>
        </label>

        <label className="fz-check">
          <input type="checkbox" checked={form.bestseller} onChange={set('bestseller')} />
          <span>Bestseller</span>
        </label>

        <div className="fz-field fz-field--full">
          <span className="fz-label">Add new category</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="fz-input"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="e.g. Tibetan Momos"
            />
            <button
              type="button"
              className="fz-btn fz-btn--subtle fz-btn--sm"
              onClick={() => {
                if (!newCategory.trim()) return
                onAddCategory(newCategory.trim())
                setNewCategory('')
              }}
            >
              Add
            </button>
          </div>
        </div>

        <ImageField
          value={form.image}
          folder="dishes"
          label="Dish image"
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
        />
      </div>

      <div className="fz-admin-form__actions">
        <button type="button" className="fz-btn fz-btn--subtle" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="fz-btn fz-btn--primary" disabled={busy}>
          {busy ? <Spinner size={16} /> : 'Save dish'}
        </button>
      </div>
    </form>
  )
}

/* ================================================================== app page */
export default function AdminPage () {
  const api = useApi()
  const { isDemo } = useData()
  const { success, error: toastError, notify } = useToast()

  const [tab, setTab] = useState('restaurants')
  const [busy, setBusy] = useState(false)

  // restaurants
  const loadRestaurants = useCallback(() => api.listRestaurants({ sort: 'rating' }), [api])
  const restaurants = useAsync(loadRestaurants)
  const [editingRestaurant, setEditingRestaurant] = useState(null) // { id?, data }
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')

  const selectedRestaurant = useMemo(
    () => (restaurants.data || []).find((r) => r.id === selectedRestaurantId) || (restaurants.data || [])[0],
    [restaurants.data, selectedRestaurantId],
  )

  const loadMenu = useCallback(
    () => (selectedRestaurant ? api.getMenuItems(selectedRestaurant.id) : Promise.resolve([])),
    [api, selectedRestaurant],
  )
  const menuItems = useAsync(loadMenu, { immediate: Boolean(selectedRestaurant) })

  const [editingDish, setEditingDish] = useState(null)
  const loadOrders = useCallback(() => api.listAllOrders(), [api])
  const orders = useAsync(loadOrders, { immediate: tab === 'orders' })

  async function run (task, message) {
    setBusy(true)
    try {
      await task()
      if (message) success(message)
    } catch (err) {
      toastError(err.message || 'Operation failed')
    } finally {
      setBusy(false)
    }
  }

  /* ---------------------------------------------------------- restaurants */
  async function saveRestaurant (data) {
    await run(async () => {
      if (editingRestaurant?.id) {
        await api.updateRestaurant(editingRestaurant.id, data)
      } else {
        const created = await api.createRestaurant(data)
        setSelectedRestaurantId(created.id)
      }
      await restaurants.reload()
    }, editingRestaurant?.id ? 'Restaurant updated' : 'Restaurant added')
    setEditingRestaurant(null)
  }

  function editRestaurant(restaurant) {
    setEditingRestaurant({
      id: restaurant.id,
      data: {
        name: restaurant.name,
        tagline: restaurant.tagline || '',
        cuisines: listToString(restaurant.cuisines),
        rating: restaurant.rating,
        ratingCount: restaurant.ratingCount,
        priceLevel: restaurant.priceLevel,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        image: restaurant.image || '',
        banner: restaurant.banner || '',
        address: restaurant.address,
        isOpen: restaurant.isOpen,
        isVegOnly: restaurant.isVegOnly,
        offerLabel: restaurant.offer?.label || '',
        offerCode: restaurant.offer?.code || '',
        categories: categoriesToNames(restaurant.menuCategories),
      },
    })
  }

  function deleteRestaurant (restaurant) {
    if (!window.confirm(`"${restaurant.name}" delete karein? Menu bhi hata jayegi.`)) return
    run(async () => {
      await api.deleteRestaurant(restaurant.id)
      await restaurants.reload()
    }, 'Restaurant deleted')
  }

  /* ---------------------------------------------------------------- menu */
  async function saveDish (data) {
    if (!selectedRestaurant) return
    await run(async () => {
      if (editingDish?.id) {
        await api.updateMenuItem(selectedRestaurant.id, editingDish.id, data)
      } else {
        await api.createMenuItem(selectedRestaurant.id, data)
      }
      await menuItems.reload()
    }, editingDish?.id ? 'Dish updated' : 'Dish added')
    setEditingDish(null)
  }

  async function addCategory (name) {
    if (!selectedRestaurant) return
    const id = slugify(name) || slugify(`cat-${name}`)
    if (selectedRestaurant.menuCategories?.some((c) => c.id === id)) {
      notify('Ye category pehle se hai', 'info')
      return
    }
    await run(async () => {
      await api.updateRestaurant(selectedRestaurant.id, {
        menuCategories: [...(selectedRestaurant.menuCategories || []), { id, name }],
      })
      await restaurants.reload()
    }, `Category "${name}" added`)
  }

  function deleteDish (dish) {
    if (!window.confirm(`"${dish.name}" delete karein?`)) return
    run(async () => {
      await api.deleteMenuItem(selectedRestaurant.id, dish.id)
      await menuItems.reload()
    }, 'Dish deleted')
  }

  /* -------------------------------------------------------------- orders */
  async function changeStatus (orderId, status) {
    run(async () => {
      await api.updateOrderStatus(orderId, status)
      await orders.reload()
    }, 'Order status updated')
  }

  async function importSeed () {
    const message = isDemo
      ? 'Demo data dobara load karein? (abhi ke changes reset ho jayenge)'
      : 'Seed data Firestore me import karein? Existing data overwrite ho jayega.'
    if (!window.confirm(message)) return
    await run(async () => {
      const count = await api.seedDatabase()
      await restaurants.reload()
      if (menuItems.reload) await menuItems.reload()
      notify(`${count} records written`, 'success')
    }, 'Seed data imported')
  }

  if (!restaurants.data && restaurants.loading) return <PageLoader label="Loading admin…" />

  return (
    <div className="fz-container fz-page">
      <div className="fz-admin-head">
        <div>
          <h1 className="fz-h1">Admin panel</h1>
          <p className="fz-muted fz-small">
            {isDemo
              ? 'Demo mode — changes browser ke localStorage me save hote hain.'
              : 'Firebase me live data — changes sab visitors ko turant dikhte hain.'}
          </p>
        </div>
        <div className="fz-admin-head__actions">
          <button type="button" className="fz-btn fz-btn--subtle fz-btn--sm" onClick={importSeed} disabled={busy}>
            {isDemo ? 'Reset demo data' : 'Import seed data'}
          </button>
          <button
            type="button"
            className="fz-btn fz-btn--subtle fz-btn--sm"
            onClick={() => run(() => restaurants.reload(), 'Refreshed')}
          >
            Refresh
          </button>
        </div>
      </div>

      <nav className="fz-admin-tabs" role="tablist">
        {[
          ['restaurants', `Restaurants (${restaurants.data?.length || 0})`],
          ['menu', 'Menu'],
          ['orders', `Orders (${orders.data?.length || 0})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ------------------------------------------------------ restaurants */}
      {tab === 'restaurants' && (
        <section className="fz-admin-section">
          {editingRestaurant && (
            <div className="fz-admin-panel">
              <h2>{editingRestaurant.id ? 'Edit restaurant' : 'New restaurant'}</h2>
              <RestaurantForm
                initial={editingRestaurant.data}
                busy={busy}
                onCancel={() => setEditingRestaurant(null)}
                onSubmit={saveRestaurant}
              />
            </div>
          )}

          <div className="fz-admin-toolbar">
            <h2>Restaurants</h2>
            {!editingRestaurant && (
              <button
                type="button"
                className="fz-btn fz-btn--primary fz-btn--sm"
                onClick={() => setEditingRestaurant({ id: null, data: BLANK_RESTAURANT })}
              >
                + Add restaurant
              </button>
            )}
          </div>

          <div className="fz-admin-list">
            {(restaurants.data || []).map((restaurant) => (
              <article key={restaurant.id} className="fz-admin-row">
                <ImageWithFallback src={restaurant.image} alt="" seed={restaurant.id} className="fz-admin-row__img" />
                <div className="fz-admin-row__body">
                  <h3>{restaurant.name}</h3>
                  <p className="fz-small fz-muted">
                    {(restaurant.cuisines || []).join(', ')} · {restaurant.deliveryTime} min ·{' '}
                    {restaurant.deliveryFee ? `₹${restaurant.deliveryFee}` : 'Free'} delivery
                  </p>
                </div>
                <Rating value={restaurant.rating} size="sm" />
                <div className="fz-admin-row__actions">
                  <button type="button" className="fz-btn fz-btn--subtle fz-btn--sm" onClick={() => editRestaurant(restaurant)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="fz-btn fz-btn--danger fz-btn--sm"
                    onClick={() => deleteRestaurant(restaurant)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ menu */}
      {tab === 'menu' && (
        <section className="fz-admin-section">
          <div className="fz-admin-toolbar">
            <h2>Dishes</h2>
            <select
              className="fz-select"
              style={{ width: 'auto', minWidth: 220 }}
              value={selectedRestaurant?.id || ''}
              onChange={(event) => {
                setSelectedRestaurantId(event.target.value)
                setEditingDish(null)
              }}
            >
              {(restaurants.data || []).map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {editingDish && selectedRestaurant && (
            <div className="fz-admin-panel">
              <h2>{editingDish.id ? 'Edit dish' : `New dish in ${selectedRestaurant.name}`}</h2>
              <DishForm
                categories={selectedRestaurant.menuCategories || []}
                initial={editingDish.data}
                busy={busy}
                onCancel={() => setEditingDish(null)}
                onSubmit={saveDish}
                onAddCategory={addCategory}
              />
            </div>
          )}

          {selectedRestaurant && !editingDish && (
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="fz-btn fz-btn--primary fz-btn--sm"
                onClick={() => setEditingDish({ id: null, data: { ...BLANK_DISH, categoryId: selectedRestaurant.menuCategories?.[0]?.id || '' } })}
              >
                + Add dish
              </button>
            </div>
          )}

          <div className="fz-admin-list">
            {(menuItems.data || []).map((dish) => (
              <article key={dish.id} className="fz-admin-row">
                <ImageWithFallback src={dish.image} alt="" seed={dish.id} className="fz-admin-row__img" />
                <div className="fz-admin-row__body">
                  <h3>
                    {dish.name} {dish.bestseller && <span className="fz-chip">Bestseller</span>}
                  </h3>
                  <p className="fz-small fz-muted fz-truncate">
                    {dish.veg ? 'Veg' : 'Non-veg'} · {formatCurrency(dish.price)} ·{' '}
                    {(selectedRestaurant?.menuCategories || []).find((c) => c.id === dish.categoryId)?.name || 'Uncategorised'}
                  </p>
                </div>
                <div className="fz-admin-row__actions">
                  <button
                    type="button"
                    className="fz-btn fz-btn--subtle fz-btn--sm"
                    onClick={() => setEditingDish({ id: dish.id, data: dish })}
                  >
                    Edit
                  </button>
                  <button type="button" className="fz-btn fz-btn--danger fz-btn--sm" onClick={() => deleteDish(dish)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {menuItems.loading && <Spinner />}
            {!menuItems.loading && !(menuItems.data || []).length && (
              <p className="fz-muted fz-small">Abhi koi dish nahi — “+ Add dish” se shuru karein.</p>
            )}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- orders */}
      {tab === 'orders' && (
        <section className="fz-admin-section">
          <div className="fz-admin-toolbar">
            <h2>All orders</h2>
          </div>

          <div className="fz-admin-list">
            {(orders.data || []).map((order) => (
              <article key={order.id} className="fz-admin-row">
                <div className="fz-admin-row__body">
                  <h3>{order.restaurantName}</h3>
                  <p className="fz-small fz-muted">
                    {order.userName || order.userEmail} · {formatDateTime(order.placedAt)} ·{' '}
                    {order.items?.length || 0} items · {formatCurrency(order.totals?.total || 0)}
                  </p>
                </div>
                <select
                  className="fz-select"
                  style={{ width: 'auto' }}
                  value={order.status}
                  onChange={(event) => changeStatus(order.id, event.target.value)}
                  aria-label="Order status"
                >
                  {[...ORDER_STATUSES, 'cancelled'].map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </article>
            ))}
            {orders.loading && <Spinner />}
            {!orders.loading && !(orders.data || []).length && (
              <p className="fz-muted fz-small">Abhi koi order nahi.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
