import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/home.vue';
import booking from '../views/booking.vue';
import refund from '../views/refund.vue';
import reschedule from '../views/reschedule.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        path: '/booking',
        name: 'booking',
        component: booking,
    },
    {
        path: '/refund',
        name: 'refund',
        component: refund,
    },
    {
        path: '/reschedule',
        name: 'reschedule',
        component: reschedule,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
