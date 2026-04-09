import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BarChart2, Tag, Clock4, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Header       from './components/Header';
import ControlPanel from './components/ControlPanel';
import StatCard     from './components/StatCard';
import Terminal     from './components/Terminal';
import AgentGrid    from './components/AgentGrid';

const API_BASE = 'http://localhost:3001/api';

// Recursos de Áudio
const successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

function App() {
  const [config, setConfig]   = useState(null);
  const [logs,   setLogs]     = useState([]);
  const [status, setStatus]   = useState({ online: false });
  const [metrics, setMetrics] = useState({ followers: 0, likes: 0, reach: 0, comments: 0, tokenValid: true });
  const [timeLeft, setTimeLeft] = useState('--:--');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  
  const prevPostsRef = useRef(0);
  const audioContextStarted = useRef(false);
  const lastActionRef = useRef(0);
  const lastAlertTime = useRef(null);

  // Solicitar Permissão de Notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Desbloquear áudio no primeiro clique
    const unlockAudio = () => {
      audioContextStarted.current = true;
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
  }, []);

  const fetchData = useCallback(async () => {
    // Evita que o fetch automático sobrescreva uma ação manual recente (Optimistic UI)
    if (Date.now() - lastActionRef.current < 2500) return;

    try {
      const confRes = await axios.get(`${API_BASE}/config`, { timeout: 5000 });
      setConfig(confRes.data);
      setError(null);
      
      const [logRes, statRes, metRes] = await Promise.all([
        axios.get(`${API_BASE}/logs`, { timeout: 3000 }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/status`, { timeout: 3000 }).catch(() => ({ data: { online: false } })),
        axios.get(`${API_BASE}/metrics`, { timeout: 3000 }).catch(() => ({ data: { facebook: { tokenValid: true } } })),
      ]);

      setLogs(logRes.data);
      setStatus(statRes.data);
      
      const newMetrics = metRes.data;
      setMetrics(newMetrics.facebook || { followers: 0, reach: 0, comments: 0, tokenValid: true });

      const currentPosts = newMetrics.stats?.totalPosts || 0;
      if (prevPostsRef.current > 0 && currentPosts > prevPostsRef.current) {
        if (audioContextStarted.current) successSound.play().catch(() => {});
        if (Notification.permission === 'granted') {
          new Notification('🔬 CRIMES REAIS: Novo Caso Publicado!', {
            body: 'O dossiê detalhado e a foto real foram enviados para o Facebook.',
            icon: '/logo.png'
          });
        }
      }
      prevPostsRef.current = currentPosts;

      if (newMetrics.facebook?.tokenValid === false) {
        const now = Date.now();
        if (!lastAlertTime.current || (now - lastAlertTime.current > 60000)) {
          if (audioContextStarted.current) {
            alertSound.play().catch(() => {});
            lastAlertTime.current = now;
          }
        }
      } else {
        lastAlertTime.current = null;
      }
    } catch (err) {
      console.error('Erro ao carregar Dashboard:', err);
      // Mantemos o erro apenas se não tivermos config nenhuma ainda
      setError(prev => prev || 'Servidor offline ou lento demais. Verifique a conexão.');
    }
  }, []); // Removida dependência de [config] para evitar loop infinito

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    
    // Timeout para tela de carregamento (Splash)
    const timeout = setTimeout(() => {
      setError(prev => prev || 'Reconectando ao servidor...');
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fetchData]); // Removido config das deps

  const toggleBot = async () => {
    if (!config) return;
    lastActionRef.current = Date.now();
    const updated = { ...config, isActive: !config.isActive };
    
    // Atualização Otimista: Muda a UI na hora
    setConfig(updated);
    
    try {
        await axios.post(`${API_BASE}/config`, updated);
    } catch (e) {
        console.error('Erro ao alternar bot:', e);
        // Em caso de erro, reverte a UI após um tempo
        setTimeout(fetchData, 500);
    }
  };

  const triggerPost = async () => {
    lastActionRef.current = Date.now();
    setLoading(true);
    await axios.post(`${API_BASE}/trigger`);
    setTimeout(() => {
      setLoading(false);
      fetchData();
    }, 3000);
  };

  const updatePosts = (val, gMode = null, interval = null) => {
    lastActionRef.current = Date.now();
    const updated = { 
      ...config, 
      postsPerDay: parseInt(val, 10),
      growthMode: gMode !== null ? gMode : config.growthMode,
      intervalMinutes: interval !== null ? parseInt(interval, 10) : config.intervalMinutes
    };
    
    // Atualização Otimista
    setConfig(updated);
    axios.post(`${API_BASE}/config`, updated).catch(() => {
        setTimeout(fetchData, 500);
    });
  };

  const updateFbToken = async (newToken) => {
    try {
      lastActionRef.current = Date.now();
      setLoading(true);
      await axios.post(`${API_BASE}/settings/fb-token`, { token: newToken });
      if (audioContextStarted.current) successSound.play().catch(() => {});
      setTimeout(fetchData, 1000);
      alert('✅ Token atualizado com sucesso no arquivo .env!');
    } catch (err) {
      alert('❌ Erro ao atualizar token: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ── Estatísticas ── */
  // Efeito para o Timer regressivo (Sincronização em tempo real)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!config?.lastRun) return;

      const intervalMin = config.growthMode ? 30 : Math.floor((24 * 60) / (config.postsPerDay || 5));
      const nextRun = new Date(new Date(config.lastRun).getTime() + intervalMin * 60000);
      const diffMs = nextRun - new Date();

      if (diffMs > 0) {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      } else {
        setTimeLeft('Em breve...');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  const postsToday = status?.postsScheduledToday || 0;

  /* ── Tela de carregamento / Contingência ── */
  if (!config) {
    return (
      <div className="loading-screen">
        <div className="loading-ring" />
        <span className="loading-text">Iniciando o sistema...</span>
        {error && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="error-bypass"
            style={{ marginTop: '20px', textAlign: 'center' }}
          >
            <p style={{ color: '#ff4444', marginBottom: '10px', fontSize: '14px' }}>{error}</p>
            <button 
              onClick={() => setConfig({ isActive: true, postsPerDay: 5, categories: [] })}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Pular Carregamento e Entrar Manualmente
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      
      {/* Alerta de Token (Sincronizado) */}
      <AnimatePresence>
        {!metrics.tokenValid && (
          <motion.div 
            className="token-error-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="banner-content">
              <AlertTriangle className="banner-icon" />
              <span>TOKEN INATIVO: A conexão com o Facebook caiu. <br/><b>Reconecte agora para não parar as postagens!</b></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabeçalho */}
      <Header status={status} />

      {/* Barra de estatísticas REAIS */}
      <motion.div
        className="stats-strip"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
      >
        <StatCard
          icon={BarChart2}
          label="Seguidores Reais"
          value={metrics.followers}
          accent="cyan"
        />
        <StatCard
          icon={Clock4}
          label="Tempo para Próximo Post"
          value={timeLeft}
          accent="violet"
        />
        <StatCard
          icon={Tag}
          label="Alcance / Comentários"
          value={`${metrics.reach} / ${metrics.comments}`}
          accent="green"
        />
      </motion.div>
      
      {/* Grade de Agentes v9.0 */}
      <AgentGrid agents={status.agents} />

      {/* Grid principal: Controles | Registro */}
      <div className="dashboard-grid">
        <ControlPanel
          config={config}
          status={status}
          metrics={metrics}
          loading={loading}
          onToggle={toggleBot}
          onTrigger={triggerPost}
          onPostsChange={updatePosts}
          onUpdateToken={updateFbToken}
        />

        <Terminal logs={logs} />
      </div>

      <div className="footer-glow" />
    </div>
  );
}

export default App;
