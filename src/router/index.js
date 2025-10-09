import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/home.vue';
import booking from '../views/booking.vue';
import refund from '../views/refund.vue';
import reschedule from '../views/reschedule.vue';
import flightManagement from '../views/flightManagement.vue';
import login from '../views/login.vue';
import register from '../views/register.vue';
import BookingDetail from '../views/bookingDetail.vue';
import UserCenter from '../views/userCenter.vue';
import FlightDetail from '../views/flightDetail.vue';
import AgencyManagement from '../views/agencyManagement.vue';
import Payment from '../views/payment.vue';
import NotificationCenter from '../views/notificationCenter.vue';

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: login,
    },
    {
        path: '/register',
        name: 'register',
        component: register,
    },
    {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/booking',
        name: 'booking',
        component: booking,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/refund',
        name: 'refund',
        component: refund,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/reschedule',
        name: 'reschedule',
        component: reschedule,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/flight-management',
        name: 'flightManagement',
        component: flightManagement,
        meta: {
            requiresAuth: true,
            requiresAdmin: false,
            requiresAgencyOrAdmin: true
        }
    },
    {
        path: '/agency-management',
        name: 'agencyManagement',
        component: AgencyManagement,
        meta: {
            requiresAuth: true,
            requiresAdmin: true
        }
    },
    {
        path: '/flight-detail/:id',
        name: 'flightDetail',
        component: FlightDetail,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/pnr-search',
        name: 'pnr-search',
        component: () => import('../views/pnrSearch.vue')
    },
    {
    path: '/booking-detail/:id?',
    name: 'bookingDetail',
    component: BookingDetail,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/user-center',
    name: 'userCenter',
    component: UserCenter,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/payment/:id?',
    name: 'payment',
    component: Payment,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/notification-center',
    name: 'notificationCenter',
    component: NotificationCenter,
    meta: {
      requiresAuth: true
    }
  }];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
    // 获取store实例
    const store = window.app?.config.globalProperties.$store || null;
    
    // 检查是否需要登录
    if (to.meta.requiresAuth) {
        // 检查用户是否已登录
        const isLoggedIn = store?.getters.isLoggedIn || 
                          localStorage.getItem('authToken') !== null;
        
        if (!isLoggedIn) {
            // 未登录，重定向到登录页面
            next({ path: '/login', query: { redirect: to.fullPath } });
        } else {
            // 检查用户角色
            const isAdmin = store?.getters.isAdmin || 
                           JSON.parse(localStorage.getItem('userInfo') || '{}').role === 'ADMIN';
            const isAgency = store?.getters.isAgency || 
                            JSON.parse(localStorage.getItem('userInfo') || '{}').role === 'AGENCY';
            const isPassenger = store?.getters.isPassenger || 
                              JSON.parse(localStorage.getItem('userInfo') || '{}').role === 'PASSENGER';
            
            // 检查是否需要管理员或机构用户权限
            if (to.meta.requiresAgencyOrAdmin) {
                if (!isAdmin && !isAgency) {
                    // 没有权限，重定向到首页
                    next({ path: '/' });
                    alert('您没有权限访问该页面');
                } else {
                    next();
                }
            }
            // 检查是否需要管理员权限
            else if (to.meta.requiresAdmin) {
                if (!isAdmin) {
                    // 没有管理员权限，重定向到首页
                    next({ path: '/' });
                    alert('您没有权限访问该页面');
                } else {
                    next();
                }
            }
            // 管理员只应访问管理员专属页面和机构/管理员共享页面
            else if (isAdmin) {
                // 管理员访问非共享非专属页面，重定向到航班管理页面
                next({ path: '/flight-management' });
                alert('管理员请使用管理员专属功能');
            }
            // 机构用户只应访问机构/管理员共享页面和普通用户页面
            else if (isAgency) {
                next();
            }
            // 普通用户访问普通页面
            else {
                next();
            }
        }
    } else {
        next();
    }
});

export default router;
