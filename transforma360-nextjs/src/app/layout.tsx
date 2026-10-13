import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'TRANSFORMA 360',description:'Sua rotina de treinos, alimentação e evolução em um só lugar.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
