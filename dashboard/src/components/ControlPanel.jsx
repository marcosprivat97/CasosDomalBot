import React from 'react';
import { motion } from 'framer-motion';
import { Settings2, Pause, Play, Send, RefreshCw, Clock, ShieldCheck } from 'lucide-react';

export default function ControlPanel({ config, status, metrics, loading, onToggle, onTrigger, onPostsChange, onUpdateToken }) {
  const sliderPct = config ? Math.round(((config.postsPerDay - 1) / 23) * 100) : 0;

  return (
    <motion.section
      className="glass control-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Cabeçalho da seção */}
      <div className="section-label">
        <Settings2 size={14} style={{ color: 'var(--cyan)' }} />
        <span className="section-label-text">Controle do Bot</span>
      </div>

      {/* Estado do Bot */}
      <div className="system-state-row">
        <div className="system-state-info">
          <span className="label-xs">O bot está</span>
          <span className={`system-state-value ${config?.isActive ? 'active' : 'standby'}`}>
            {config?.isActive ? 'SISTEMA ATIVO' : 'EM STANDBY'}
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`toggle-btn ${config?.isActive ? 'active' : 'inactive'}`}
          title={config?.isActive ? 'Pausar Investigação' : 'Iniciar Modo Elite'}
        >
          {config?.isActive
            ? <Pause size={18} fill="currentColor" />
            : <Play size={18} fill="currentColor" />
          }
        </button>
      </div>

      {/* Seletor de Intervalo Personalizado */}
      <div className="interval-section" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div className="system-state-row">
          <div className="system-state-info">
            <span className="label-xs">Modo Intervalo (Dinamico)</span>
            <span className={`system-state-value ${config?.growthMode ? 'active' : 'standby'}`}>
              {config?.growthMode ? 'ATIVADO' : 'DESATIVADO'}
            </span>
          </div>
          <button
            onClick={() => onPostsChange(config.postsPerDay, !config.growthMode)}
            className={`toggle-btn ${config?.growthMode ? 'active' : 'inactive'}`}
            style={{ width: 44, height: 24 }}
          >
            <RefreshCw size={14} className={config?.growthMode ? 'spin' : ''} />
          </button>
        </div>

        <div className="interval-container" style={{ 
          opacity: config?.growthMode ? 1 : 0.4,
          pointerEvents: config?.growthMode ? 'all' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <span className="label-xs" style={{ display: 'block', marginTop: 12, marginBottom: 8, color: 'var(--muted)' }}>
            Escolher intervalo entre postagens:
          </span>
          <div className="interval-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px'
          }}>
            {[5, 10, 15, 20, 25, 30, 45, 60].map(min => (
              <button
                key={min}
                onClick={() => onPostsChange(config.postsPerDay, true, min)}
                className={`interval-chip ${config.intervalMinutes === min ? 'active' : ''}`}
                style={{
                  padding: '6px 4px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: config.intervalMinutes === min ? 'var(--accent)' : 'transparent',
                  color: config.intervalMinutes === min ? 'white' : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {min}m
              </button>
            ))}
          </div>
          {!config?.growthMode && (
            <p style={{ fontSize: '10px', color: 'var(--cyan)', marginTop: 8 }}>
              💡 Ative o Modo Intervalo para escolher os minutos.
            </p>
          )}
        </div>
      </div>

      {/* Quantidade de publicações por dia */}
      <div className="slider-section" style={{ marginTop: 20 }}>
        <div className="slider-header">
          <span className="label-xs">Frequência Manual (Modo Clássico)</span>
          <div className="slider-value-display">
            <span className="slider-val">{config?.postsPerDay ?? 5}</span>
            <span className="slider-unit">posts/dia</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="48"
          disabled={config?.growthMode}
          value={config?.growthMode ? 48 : (config?.postsPerDay ?? 5)}
          onChange={(e) => onPostsChange(e.target.value)}
          className="slider-track"
          style={{ 
            '--pct': `${config?.growthMode ? 100 : Math.round(((config.postsPerDay - 1) / 47) * 100)}%`, 
            opacity: config?.growthMode ? 0.5 : 1 
          }}
        />
        <div className="slider-hint">
          {config?.growthMode ? 'O Modo Intervalo está mandando na agenda agora.' : 'Postagens em horários fixos de pico.'}
        </div>
      </div>

      {/* Botão de publicar agora */}
      <button
        onClick={onTrigger}
        disabled={loading || !config?.isActive}
        className="btn-deploy"
        style={{
          background: 'linear-gradient(135deg, #FF3D00, #D50000)',
          boxShadow: '0 4px 15px rgba(213, 0, 0, 0.3)'
        }}
        title={!config?.isActive ? 'Ligue o sistema para investigar' : 'Forçar investigação agora'}
      >
        {loading
          ? <RefreshCw size={16} style={{ animation: 'spin 0.9s linear infinite' }} />
          : <Send size={16} />
        }
        {loading ? 'Processando Dossiê...' : 'Investigar Agora'}
      </button>

      {!config?.isActive && (
        <p className="control-hint">⚠️ Ative o MODO INVESTIGAÇÃO para iniciar</p>
      )}

      {/* Informações */}
      <div className="telemetry-section">
        <div className="section-label" style={{ marginBottom: 0, paddingBottom: 12 }}>
          <Clock size={14} style={{ color: 'var(--muted)' }} />
          <span className="section-label-text">Informações</span>
        </div>

        <div className="tele-item">
          <span className="tele-item-label">Último caso enviado</span>
          <span className="tele-item-value" title={metrics?.lastCase}>
            {metrics?.lastCase ? (metrics.lastCase.length > 20 ? metrics.lastCase.substring(0, 20) + '...' : metrics.lastCase) : 'Aguardando...'}
          </span>
        </div>

        {/* Gerenciamento de Token (NOVO) */}
        <div className="token-management-box" style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: 8,
          border: metrics?.tokenValid === false ? '1px solid var(--danger)' : '1px solid var(--border)'
        }}>
          <span className="label-xs" style={{ color: metrics?.tokenValid === false ? 'var(--danger)' : 'var(--muted)', display: 'block', marginBottom: 8 }}>
            {metrics?.tokenValid === false ? '🚨 Ação Necessária: Novo Token' : 'Chave de Acesso Facebook'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              type="password" 
              placeholder="Cole o novo token aqui..."
              className="token-input-field"
              id="fb-token-input"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'white',
                flex: 1
              }}
            />
            <button 
              onClick={() => {
                const val = document.getElementById('fb-token-input').value;
                if(val) onUpdateToken(val);
              }}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '4px',
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Salvar novo token"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="uptime-badge">
          <ShieldCheck size={18} strokeWidth={2} />
          <div className="uptime-text">
            <span className="uptime-title">Estabilidade</span>
            <span className="uptime-val">Sistema estável</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
