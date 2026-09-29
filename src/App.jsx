/* =============================================================================
   App — providers, layout aur routes
   ========================================================================== */

import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'
import Toasts from './components/Toasts'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/ui'

import { DataProvider, useData } from './context/DataContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'

import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RestaurantPage from './pages/RestaurantPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// heavy / rarely used pages lazy load (initial bundle chhota rehta hai)
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function Shell () {
  const { ready } = useData()

  if (!ready) return <PageLoader label="Starting FoodieZone…" />

  return (
    <div className="fz-app">
      <Header />
      <main id="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toasts />
    </div>
  )
}

export default function App () {
  return (
    <ToastProvider>
      <DataProvider>
        <AuthProvider>
          <CartProvider>
            <Shell />
          </CartProvider>
        </AuthProvider>
      </DataProvider>
    </ToastProvider>
  )
}
