import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Wifi, CheckCircle2 } from 'lucide-react';

export default function Header({ status }) {
  return (
    <motion.header
      className="glass app-header"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Marca */}
      <div className="header-brand">
        <div className="header-icon-wrap">
          <Bot size={22} strokeWidth={1.8} />
        </div>
        <div className="header-brand-text">
          <h1 className="brand-title">CASOS DOMAL <span style={{fontSize: '10px', color: 'var(--accent)', verticalAlign: 'middle', marginLeft: '5px'}}>ELITE</span></h1>
          <div className="header-meta">
            <div className={`badge ${status.online ? 'badge-online' : 'badge-offline'}`}>
              <span className={`badge-dot ${status.online ? 'pulse' : ''}`} />
              {status.online ? 'MODO INVESTIGAÇÃO' : 'SISTEMA OFFLINE'}
            </div>
            <span className="header-version">{status.version || 'v9.0.0-PRO'}</span>

          </div>
        </div>

      </div>

      {/* Lado direito — informações simples */}
      <div className="header-right">
        <div className="header-metric">
          <span className="header-metric-label">Conexão</span>
          <div className="header-metric-value">
            <Wifi size={11} style={{ color: 'var(--cyan)' }} />
            {status.online ? 'Ativa' : 'Sem conexão'}
          </div>
        </div>

        <div className="header-divider" />

        <div className="header-metric">
          <span className="header-metric-label">Facebook</span>
          <div className="header-metric-value">
            <CheckCircle2 size={11} style={{ color: 'var(--success)' }} />
            Configurado
          </div>
        </div>
      </div>
    </motion.header>
  );
}
