require('dotenv').config();
const { runViralCycle } = require('./src/scheduler');
const logger = require('./src/logger');

/**
 * Gatilho Turbo Elite v9.0-ORCHESTRATOR
 * Executa um ciclo completo de postagem agora mesmo.
 */
async function startTurbo() {
    console.log('--- 🚀 DISPARANDO GATILHO TURBO ELITE v9.0 ---');
    console.log('Extraindo Foto Real -> Multi-Agentes v9 -> Postagem FB\n');
    
    try {
        await runViralCycle();
        console.log('\n✅ CICLO TURBO FINALIZADO COM SUCESSO!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ FALHA NO CICLO TURBO:', error.message);
        process.exit(1);
    }
}

startTurbo();
