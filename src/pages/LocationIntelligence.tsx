import { Link } from 'react-router-dom';
import LocationIntelligencePanel from '../components/dashboard/LocationIntelligencePanel';
import { useSchedule } from '../hooks/useSchedule';
import Card from '../components/ui/Card';

export default function LocationIntelligence(){const {items}=useSchedule();return <div className="mx-auto w-full max-w-7xl space-y-5 pb-8 fade-up"><Card className="p-5"><h1 className="text-2xl font-black">Location Intelligence</h1><p className="mt-1 text-sm text-slate-500">Konteks lokasi, perjalanan, geofence, dan jadwal dalam satu layar.</p><Link to="/settings" className="mt-3 inline-flex text-xs font-bold text-indigo-500">Atur tracking di Settings →</Link></Card><LocationIntelligencePanel schedule={items}/></div>}
