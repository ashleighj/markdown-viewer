import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from './views/WelcomeView.vue'
import WorkspaceView from './views/WorkspaceView.vue'
import FileView from './views/FileView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'welcome', component: WelcomeView },
    { path: '/ws/:workspaceId', name: 'workspace', component: WorkspaceView },
    {
      path: '/ws/:workspaceId/:path(.*)',
      name: 'file',
      component: FileView,
    },
  ],
})

export default router
