import { useEffect, useState } from 'react';
import { subscribeNotifications } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../types';
export function useNotifications(){const {user}=useAuth();const [notifications,setNotifications]=useState<Notification[]>([]);useEffect(()=>{if(!user){setNotifications([]);return}return subscribeNotifications(user.id,setNotifications,()=>setNotifications([]));},[user]);return {notifications,unreadCount:notifications.filter(n=>!n.read).length};}
