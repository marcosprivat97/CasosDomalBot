import React from 'react';
import { motion } from 'framer-motion';
import { Shield, PenTool, Image, UserCheck, Clock, Search, TrendingUp, Briefcase } from 'lucide-react';

const agentIcons = {
  Scout: Search,
  Writer: PenTool,
  Visual: Image,
  GateKeeper: Shield,
  Scheduler: Clock,
  Analyst: UserCheck,
  CEO: Briefcase,
  Analytics: TrendingUp
};

export default function AgentGrid({ agents }) {
  if (!agents || agents.length === 0) return null;

  return (
    <motion.div 
      className="agents-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      style={{ marginTop: '24px' }}
    >
      <div className="section-label">
        <Shield size={14} style={{ color: 'var(--cyan)' }} />
        <span className="section-label-text">ECOSSISTEMA MULTI-AGENTE v9.0</span>
      </div>

      <div className="agents-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
        gap: '12px' 
      }}>
        {agents.map((agent, i) => {
          const Icon = agentIcons[agent.name] || Shield;
          return (
            <motion.div
              key={agent.name}
              className="agent-card glass"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: agent.active ? '1px solid var(--border-cyan)' : '1px solid var(--border)',
                background: agent.active ? 'rgba(0, 230, 255, 0.03)' : 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={`agent-icon-small ${agent.active ? 'active' : ''}`} style={{
                    color: agent.active ? 'var(--cyan)' : 'var(--muted)',
                    display: 'flex'
                }}>
                  <Icon size={16} />
                </div>
                <div className={`status-dot ${agent.active ? 'pulse' : ''}`} style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: agent.active ? 'var(--cyan)' : 'var(--muted-2)'
                }} />
              </div>
              
              <div className="agent-info">
                <span style={{ 
                    display: 'block', 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    letterSpacing: '0.05em',
                    color: agent.active ? 'white' : 'var(--text-dim)'
                }}>
                  {agent.name.toUpperCase()}
                </span>
                <span style={{ 
                    display: 'block', 
                    fontSize: '9px', 
                    color: agent.active ? 'var(--cyan)' : 'var(--muted)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                  {agent.status}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
