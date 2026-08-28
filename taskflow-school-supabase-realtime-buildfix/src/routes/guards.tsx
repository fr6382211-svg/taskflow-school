import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/ui/Skeleton';
export function AuthLoadingScreen(){return <div className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-sm text-center"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white font-black">TF</div><Skeleton className="mx-auto h-4 w-40"/><Skeleton className="mx-auto mt-2 h-3 w-24"/></div></div>}
export function ProtectedRoute({children}:{children:React.ReactNode}){const {isAuthenticated,loading}=useAuth();const loc=useLocation();if(loading)return <AuthLoadingScreen/>;return isAuthenticated?<>{children}</>:<Navigate to="/login" replace state={{from:loc.pathname}}/>}
export function AdminRoute({children}:{children:React.ReactNode}){const {isAuthenticated,isAdmin,loading}=useAuth();if(loading)return <AuthLoadingScreen/>;if(!isAuthenticated)return <Navigate to="/login" replace/>;return isAdmin?<>{children}</>:<Navigate to="/403" replace/>}
export function GuestRoute({children}:{children:React.ReactNode}){const {isAuthenticated,loading}=useAuth();if(loading)return <AuthLoadingScreen/>;return isAuthenticated?<Navigate to="/dashboard" replace/>:<>{children}</>}
