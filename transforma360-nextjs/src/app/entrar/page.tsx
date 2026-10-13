import { supabaseConfigured } from '@/lib/config';
import AuthForm from '@/components/AuthForm';
export default function Login(){return <AuthForm enabled={supabaseConfigured()}/>}
