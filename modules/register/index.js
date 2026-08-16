import RegisterView from './RegisterView.vue'

export function installRegisterModule(router) {
  router.addRoute({
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { title: '用户注册' },
  })
}
