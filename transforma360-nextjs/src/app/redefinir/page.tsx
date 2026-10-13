import ResetPassword from '@/components/ResetPassword';
import { supabaseConfigured } from '@/lib/config';
export default function ResetPage(){return <ResetPassword enabled={supabaseConfigured()}/>}
