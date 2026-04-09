require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Validação Crítica de Ambiente (Dashboard API)
const requiredEnv = ['GROQ_API_KEY', 'FB_PAGE_ID', 'FB_ACCESS_TOKEN', 'HF_TOKEN'];
const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length > 0) {
    logger.error('CRITICAL: API do Dashboard iniciada sem as chaves do .env!');
    missing.forEach(key => logger.error(` -> ${key}`));
    logger.error('As funcoes de postagem manual no painel vao FALHAR.');
}

const { runViralCycle, getConfig } = require('./scheduler');
const { getPageMetrics, getPageInsights, getRecentCommentsCount } = require('./facebook');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'bot.log');

/**
 * Endpoint para obter a configuração atual
 */
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        res.json(config);
    } catch (e) {
        logger.error('Erro ao ler config no servidor:', e.message);
        res.status(500).json({ error: 'Falha ao ler arquivo de configuração' });
    }
});

/**
 * Endpoint para salvar novas configurações
 */
app.post('/api/config', (req, res) => {
    try {
        const newConfig = req.body;
        // Validação básica
        if (typeof newConfig.isActive !== 'boolean') throw new Error('Status inválido');
        
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        logger.info(`Configuracoes atualizadas: ${newConfig.isActive ? 'ATIVADO' : 'PAUSADO'} | ${newConfig.postsPerDay} posts/dia`);
        res.json({ success: true, config: newConfig });
    } catch (e) {
        logger.error('Erro ao salvar config no servidor:', e.message);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Endpoint para ler os logs em tempo real
 */
app.get('/api/logs', (req, res) => {
    try {
        if (!fs.existsSync(LOG_PATH)) return res.json([]);
        const logs = fs.readFileSync(LOG_PATH, 'utf8')
            .split('\n')
            .filter(Boolean)
            .slice(-100) // Pega as últimas 100 linhas
            .reverse();
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Falha ao ler logs' });
    }
});

/**
 * Forçar uma postagem imediata
 */
app.post('/api/trigger', async (req, res) => {
    logger.info('>>> GATILHO MANUAL: Iniciando ciclo de postagem via Dashboard');
    
    // Rodar em background para não travar o dashboard
    runViralCycle().catch(err => {
        logger.error('Erro no ciclo manual:', err.message);
    });

    res.json({ message: 'Ciclo de postagem iniciado em segundo plano!' });
});

/**
 * Métricas em Tempo Real (Otimizado para não travar o painel)
 */
let cachedFbMetrics = { followers: 0, reach: 0, comments: 0, tokenValid: true, lastUpdate: 0 };

app.get('/api/metrics', async (req, res) => {
    try {
        const stats = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stats.json'), 'utf8'));
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/config.json'), 'utf8'));

        // Se o cache tiver menos de 5 minutos, usa ele para ser INSTANTÂNEO
        const now = Date.now();
        if (now - cachedFbMetrics.lastUpdate > 300000) {
            // Dispara atualização em background
            (async () => {
                try {
                    const [m, i, c] = await Promise.all([
                        getPageMetrics().catch(() => ({ followers: 0 })),
                        getPageInsights().catch(() => ({ reach: 0 })),
                        getRecentCommentsCount().catch(() => 0)
                    ]);
                    cachedFbMetrics = { 
                        followers: m.followers || 0, 
                        reach: i.reach || 0, 
                        comments: c || 0, 
                        tokenValid: true, 
                        lastUpdate: Date.now() 
                    };
                } catch (e) {
                    if (e.message === 'FB_AUTH_FAILED') cachedFbMetrics.tokenValid = false;
                    cachedFbMetrics.lastUpdate = Date.now();
                }
            })();
        }

        res.json({
            facebook: {
                followers: cachedFbMetrics.followers,
                reach: cachedFbMetrics.reach,
                comments: cachedFbMetrics.comments,
                tokenValid: cachedFbMetrics.tokenValid,
                lastCase: stats.lastCase || 'Aguardando primeiro caso...'
            },
            stats: {
                totalPosts: stats.totalPosts || 0,
                totalReais: stats.totalPosts || 0,
                botUptime: stats.startTime || new Date().toISOString()
            },
            config
        });
    } catch (error) {
        logger.error('Erro ao compilar metricas no servidor:', error.message);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});


/**
 * Status geral do sistema para o Dashboard
 */
/**
 * Atualizar o Token do Facebook dinamicamente (.env)
 */
app.post('/api/settings/fb-token', (req, res) => {
    try {
        const { token } = req.body;
        if (!token || token.length < 20) throw new Error('Token inválido ou vazio');

        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        const tokenRegex = /^FB_ACCESS_TOKEN=.*$/m;
        const newLine = `FB_ACCESS_TOKEN=${token}`;

        if (tokenRegex.test(envContent)) {
            envContent = envContent.replace(tokenRegex, newLine);
        } else {
            envContent += `\n${newLine}\n`;
        }

        fs.writeFileSync(envPath, envContent);

        // Atualiza na memória do processo atual
        process.env.FB_ACCESS_TOKEN = token;
        
        logger.info('🔑 Token do Facebook atualizado via Dashboard com sucesso!');
        res.json({ success: true, message: 'Token atualizado com sucesso!' });
    } catch (e) {
        logger.error('Erro ao atualizar token no servidor:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/status', (req, res) => {
    try {
        const config = getConfig();
        // Log leve para monitoramento de saúde do dashboard
        // logger.debug('Dashboard Heatbeat: /api/status');
        
        res.json({
            online: true,
            isActive: config.isActive,
            growthMode: config.growthMode, 
            lastRun: config.lastRun,
            postsPerDay: config.postsPerDay,
            version: 'v9.0.0-PRO-ORCHESTRATOR',
            agents: (() => {
                const statusPath = path.join(__dirname, '../data/agents_status.json');
                if (fs.existsSync(statusPath)) {
                    const data = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
                    return Object.values(data);
                }
                return [
                    { name: 'Scout', status: 'Sondando RSS...', active: true },
                    { name: 'Writer', status: 'Aguardando pauta', active: false },
                    { name: 'Visual', status: 'Direção de Arte', active: false },
                    { name: 'GateKeeper', status: 'Revisão Crítica', active: false },
                    { name: 'Scheduler', status: 'Estrategista', active: true },
                    { name: 'Analyst', status: 'Auditoria 30m', active: true },
                    { name: 'CEO', status: 'Ordens Estratégicas', active: true },
                    { name: 'Analytics', status: 'Métricas de Dados', active: true }
                ];
            })()
        });
    } catch (error) {
        logger.error('Erro no endpoint de status:', error.message);
        // Mesmo com erro na config, se o server respondeu, está online
        res.json({ online: true, error: 'Erro ao ler configurações' });
    }
});

const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`=========================================`);
    logger.info(`DASHBOARD API ATIVA: http://localhost:${PORT}`);
    logger.info(`=========================================`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`❌ PORTA ${PORT} EM USO! Outro processo já está rodando.`);
        logger.error(`Tente rodar o script de reinício agressivo or mate o processo manualmente.`);
        process.exit(1);
    } else {
        logger.error(`❌ Erro Fatal ao iniciar servidor: ${err.message}`);
        process.exit(1);
    }
});
