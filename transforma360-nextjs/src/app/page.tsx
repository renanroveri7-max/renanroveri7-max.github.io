import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Activity, BarChart3, Check, ChevronRight, CirclePlay, Droplets, Dumbbell, HeartPulse, Leaf, LockKeyhole, MoveUpRight, ShieldCheck, Sparkles, TrendingUp, Utensils, Zap } from 'lucide-react';

const benefits = [
  { icon: Dumbbell, number: '01', title: 'Treine do seu jeito', desc: 'Organize sessões, registre cargas, séries e repetições. Tudo no seu ritmo.', color: 'lime' },
  { icon: Utensils, number: '02', title: 'Alimentação sem complicação', desc: 'Registre refeições e organize os alimentos que fazem parte do seu dia a dia.', color: 'mint' },
  { icon: TrendingUp, number: '03', title: 'Acompanhe sua evolução', desc: 'Enxergue consistência e progresso em gráficos criados com seus registros.', color: 'soft' },
];

function Brand() {
  return <Link href="/" className="p-brand" aria-label="TRANSFORMA 360, início"><span className="p-brand-symbol"><MoveUpRight size={21} strokeWidth={3}/></span><span>TRANSFORMA<b>360</b></span></Link>;
}

function DashboardShowcase(){
  return <div className="p-showcase" aria-label="Prévia ilustrativa do painel TRANSFORMA 360">
    <div className="p-showcase-shell">
      <div className="p-showcase-sidebar">
        <div className="p-showcase-mark"><MoveUpRight size={15} strokeWidth={3}/></div>
        <span className="selected"><Activity size={16}/></span>
        <span><Dumbbell size={16}/></span>
        <span><Utensils size={16}/></span>
        <span><BarChart3 size={16}/></span>
      </div>
      <div className="p-showcase-main">
        <div className="p-showcase-top"><span><small>PAINEL PESSOAL</small><strong>Hoje é um bom dia para começar.</strong></span><span className="p-showcase-circle">T</span></div>
        <div className="p-showcase-head"><div><span>VISÃO GERAL</span><h3>Um passo de cada vez<span>.</span></h3></div><span className="p-demo-chip">DEMO</span></div>
        <div className="p-showcase-grid">
          <div className="p-widget p-widget-bars"><div className="p-widget-header"><span>Atividade semanal</span><Activity size={15}/></div><div className="p-graph">
            {[25,43,35,66,53,81,45].map((v,i)=><div key={i} className="p-graph-bar"><div className="p-graph-line"><i style={{height:v+'%'}} className={i===5?'accent':''}/></div><small>{['S','T','Q','Q','S','S','D'][i]}</small></div>)}
          </div><small className="p-widget-note">Visual ilustrativo</small></div>
          <div className="p-widget p-widget-ring"><div className="p-widget-header"><span>Seu foco</span><Zap size={15}/></div><div className="p-preview-ring"><span><Dumbbell size={20}/><small>Seu ritmo</small></span></div><p>Constância é uma conquista diária.</p></div>
          <div className="p-widget p-widget-full"><div className="p-widget-header"><span>Organize seu dia</span><ArrowUpRight size={15}/></div>
            <div className="p-preview-list"><span className="p-preview-list-icon"><Dumbbell size={17}/></span><div><b>Treino</b><small>Séries e cargas registradas</small></div><ChevronRight size={16}/></div>
            <div className="p-preview-list"><span className="p-preview-list-icon mint"><Utensils size={17}/></span><div><b>Alimentação</b><small>Alimentos da sua rotina</small></div><ChevronRight size={16}/></div>
          </div>
        </div>
      </div>
    </div>
    <div className="p-floating-tag p-floating-one"><span><Check size={15}/></span><div><b>Tudo em um só lugar</b><small>Treinos · alimentação · evolução</small></div></div>
    <div className="p-floating-tag p-floating-two"><span className="mint"><TrendingUp size={16}/></span><div><b>Seu histórico importa</b><small>Registros reais, sem números inventados</small></div></div>
  </div>;
}

export default function Landing(){
  return <main className="p-site">
    <header className="p-header"><div className="p-header-inner"><Brand/><nav aria-label="Menu da página"><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#planos">Planos</a></nav><div className="p-header-actions"><Link href="/entrar" className="p-signin">Entrar</Link><Link href="/demo" className="p-top-cta">Explorar o app <ArrowUpRight size={16}/></Link></div></div></header>
    <section className="p-hero" aria-labelledby="p-hero-title"><div className="p-hero-glow" aria-hidden="true"/><div className="p-hero-inner">
      <div className="p-hero-copy"><div className="p-topline"><span className="p-topline-dot"/> UMA NOVA FORMA DE CUIDAR DA SUA ROTINA</div>
        <h1 id="p-hero-title">O seu ritmo.<br/>O seu plano.<br/><em>A sua evolução.</em></h1>
        <p className="p-hero-description">Treinos, alimentação e progresso organizados em uma experiência simples, bonita e feita para a vida real.</p>
        <div className="p-hero-buttons"><Link className="p-button p-button-primary" href="/demo">Explorar a plataforma <ArrowUpRight size={19}/></Link><a className="p-button p-button-quiet" href="#como-funciona"><CirclePlay size={20}/> Descobrir como funciona</a></div>
        <div className="p-hero-trust"><span><Check size={15}/> Feito para sua rotina</span><span><Check size={15}/> Sem promessas milagrosas</span><span><Check size={15}/> Versão de demonstração gratuita</span></div>
      </div>
      <DashboardShowcase/>
    </div></section>
    <section className="p-proof" aria-label="Três diferenciais"><div className="p-proof-inner"><div><span className="p-proof-icon"><Activity size={20}/></span><p><strong>Mais clareza</strong><small>Saiba por onde começar.</small></p></div><div><span className="p-proof-icon"><HeartPulse size={20}/></span><p><strong>Mais consistência</strong><small>Um dia de cada vez.</small></p></div><div><span className="p-proof-icon"><ShieldCheck size={20}/></span><p><strong>Mais confiança</strong><small>Sem resultados inventados.</small></p></div></div></section>
    <section className="p-section p-features" id="recursos"><div className="p-section-top"><div><span className="p-section-kicker">SIMPLES POR FORA. INTELIGENTE POR DENTRO.</span><h2>O essencial para você<br/><em>seguir em frente.</em></h2></div><p>Menos aplicativos, menos planilhas e menos confusão. Um espaço que reúne o que realmente importa na sua jornada.</p></div>
      <div className="p-feature-grid">{benefits.map(({icon:Icon,number,title,desc,color})=><article className={'p-feature-card '+color} key={number}><div className="p-feature-top"><span>{number} / RECURSOS</span><ArrowUpRight size={20}/></div><div className="p-feature-icon"><Icon size={32} strokeWidth={1.7}/></div><h3>{title}</h3><p>{desc}</p><div className="p-feature-bottom"><span>FAÇA NO SEU TEMPO</span><ChevronRight size={18}/></div></article>)}</div>
    </section>
    <section className="p-how" id="como-funciona"><div className="p-how-inner"><div className="p-how-copy"><span className="p-section-kicker">UMA EXPERIÊNCIA SEM COMPLICAÇÃO</span><h2>Menos esforço para organizar.<br/><em>Mais energia para viver.</em></h2><p>Comece com o que você tem. O TRANSFORMA 360 foi pensado para acompanhar uma rotina de verdade, sem exigir uma vida perfeita.</p><Link href="/demo" className="p-button p-button-primary">Conhecer o painel <ArrowRight size={18}/></Link></div><div className="p-how-steps">
      <div><span>01</span><p><strong>Conheça o aplicativo</strong><small>Explore a interface e veja como os recursos funcionam.</small></p><Check size={18}/></div>
      <div><span>02</span><p><strong>Organize sua rotina</strong><small>Defina suas preferências e registre o que fez.</small></p><Check size={18}/></div>
      <div><span>03</span><p><strong>Veja seu progresso</strong><small>Acompanhe tendências a partir dos seus próprios dados.</small></p><Check size={18}/></div>
    </div></div></section>
    <section className="p-price-section" id="planos"><div className="p-price-card"><div><span className="p-section-kicker">ACESSÍVEL DESDE O PRIMEIRO DIA</span><h2>Seu próximo capítulo<br/><em>começa aqui.</em></h2><p>A demonstração é gratuita para explorar. O plano comercial e as assinaturas estão em preparação — sem cobranças neste momento.</p></div><div className="p-price-action"><span><Sparkles size={19}/> PREVIEW ABERTO</span><strong>R$ 0 <small>para experimentar</small></strong><Link href="/demo" className="p-button p-button-primary">Explorar agora <ArrowUpRight size={18}/></Link></div></div></section>
    <footer className="p-footer"><Brand/><span>© TRANSFORMA 360 · Sua rotina, sua evolução.</span><span>Demonstração técnica. Não substitui acompanhamento profissional individual.</span></footer>
  </main>;
}
