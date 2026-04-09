import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Trash2 } from 'lucide-react';

const FILTERS = [
  { key: 'TUDO',  label: 'Tudo',   cls: '' },
  { key: 'ERROS', label: 'Erros',  cls: 'err-filter' },
  { key: 'OK',    label: 'Sucesso',cls: 'ok-filter' },
];

function classifyLog(line) {
  const l = line.toLowerCase();
  if (l.includes('erro') || l.includes('error') || l.includes('failed') || l.includes('falha')) return 'err';
  if (l.includes('sucesso') || l.includes('success') || l.includes('postado') || l.includes('publicado')) return 'ok';
  if (l.includes('passo') || l.includes('step') || l.includes('iniciando') || l.includes('iniciado') || l.includes('buscando') || l.includes('passo')) return 'step';
  if (l.includes('warn') || l.includes('aviso')) return 'warn';
  return 'info';
}

function levelLabel(type) {
  switch (type) {
    case 'err':  return 'ERRO';
    case 'ok':   return 'OK';
    case 'step': return 'EXEC';
    case 'warn': return 'AVISO';
    default:     return 'INFO';
  }
}

function humanizeMessage(line) {
  // Remove timestamp prefix like [03/04/2026 12:23:12] INFO:
  return line
    .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, '')
    .replace(/^\[\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\]\s*(INFO|ERROR|WARN|DEBUG):\s*/i, '')
    .replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '')
    .replace(/^(info|error|warn|debug):\s*/i, '')
    .trim();
}

export default function Terminal({ logs }) {
  const [filter, setFilter]       = useState('TUDO');
  const [cleared, setCleared]     = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const bodyRef  = useRef(null);
  const bottomRef = useRef(null);

  const visibleLogs = logs.slice(cleared);

  const filtered = visibleLogs.filter((line) => {
    if (filter === 'TUDO')  return true;
    const type = classifyLog(line);
    if (filter === 'ERROS') return type === 'err';
    if (filter === 'OK')    return type === 'ok';
    return true;
  });

  // OTIMIZAÇÃO: Limitar a renderização aos últimos 100 logs para performance
  const displayLogs = filtered.slice(-100);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [displayLogs.length, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!bodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (!atBottom && autoScroll) setAutoScroll(false);
  }, [autoScroll]);

  const handleClear = () => setCleared(logs.length);

  return (
    <motion.div
      className="glass terminal-panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Barra de título */}
      <div className="terminal-titlebar">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>

        <div className="terminal-title">
          <ScrollText size={13} style={{ color: 'var(--cyan)' }} />
          <span className="terminal-title-text">Registro de Atividades</span>
        </div>

        <div className="terminal-actions">
          {/* Filtros */}
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`terminal-filter-btn ${f.cls} ${filter === f.key ? 'active-filter' : ''}`}
              title={`Mostrar apenas: ${f.label}`}
            >
              {f.label}
            </button>
          ))}

          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

          {/* Auto-scroll */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={`terminal-scroll-btn ${autoScroll ? 'live' : ''}`}
            title={autoScroll ? 'Pausar atualização automática' : 'Retomar atualização automática'}
          >
            {autoScroll && <span className="live-dot" />}
            {autoScroll ? 'AO VIVO' : 'PAUSADO'}
          </button>

          {/* Limpar */}
          <button
            onClick={handleClear}
            className="terminal-clear-btn"
            title="Limpar a tela"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Corpo do log */}
      <div
        className="terminal-body"
        ref={bodyRef}
        onScroll={handleScroll}
      >
        {displayLogs.length === 0 ? (
          <div className="terminal-empty">
            <ScrollText size={28} className="terminal-empty-icon" strokeWidth={1} />
            <span className="terminal-empty-text">Aguardando atividades do bot...</span>
          </div>
        ) : (
          <div className="log-entries">
            {displayLogs.map((line, i) => {
              const type = classifyLog(line);
              const msg  = humanizeMessage(line);
              return (
                <div key={`${cleared}-${i}`} className="log-entry">
                  <span className="log-num">{displayLogs.length - i}</span>
                  <span className={`log-level ${type}`}>{levelLabel(type)}</span>
                  <span className={`log-message ${type}`}>{msg}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="terminal-footer">
        <span className="terminal-footer-info">Processo principal · Atualização automática</span>
        <span className="terminal-count">
          Mostrando <span>{displayLogs.length}</span> de {filtered.length} registros
        </span>
      </div>
    </motion.div>
  );
}
