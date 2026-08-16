import { createRouter, createWebHistory } from 'vue-router'

const SeckillShop = () => import('../views/SeckillShop.vue')
const Cart = () => import('../views/Cart.vue')
const AdminProducts = () => import('../views/AdminProducts.vue')
const AdminOrders = () => import('../views/AdminOrders.vue')
const Register = () => import('../views/Register.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/seckill' },
    { path: '/seckill', name: 'seckill', component: SeckillShop, meta: { title: '秒杀商城' } },
    { path: '/register', name: 'register', component: Register, meta: { title: '用户注册' } },
    { path: '/cart', name: 'cart', component: Cart, meta: { title: '购物车' } },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: AdminProducts,
      meta: { title: '商品管理' },
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrders,
      meta: { title: '订单管理' },
    },
  ],
})

// ============ 白名单 ============
const whiteList = ['/seckill', '/register']

// ============ 路由守卫 ============
router.beforeEach((to, from, next) => {
  // 🔧 改成 mall_token，跟你登录时存的一致
  const token = localStorage.getItem('mall_token')
  const role = localStorage.getItem('role') || 'user'

  // 1️⃣ 白名单直接放行
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  // 2️⃣ 需要登录的页面
  const requiresAuth = ['/cart', '/admin/orders', '/admin/products'].some(path =>
    to.path.startsWith(path)
  )

  if (requiresAuth && !token) {
    next('/register')
    return
  }

  // 3️⃣ 商品管理 → 仅限管理员
  if (to.path.startsWith('/admin/products') && role !== 'admin') {
    next('/seckill')
    return
  }

  // ✅ 其余放行
  next()
})

// ============ 标题设置 ============
router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · 极光商城`
})