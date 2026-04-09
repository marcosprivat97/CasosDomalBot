const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const APPROVALS_PATH = path.join(__dirname, '../../data/approvals.json');

class ApprovalModule {
    constructor() {
        this._ensureDir();
    }

    _ensureDir() {
        const dir = path.dirname(APPROVALS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    /**
     * Salva um novo item aguardando aprovação da foto bruta.
     */
    async createPendingRaw(news, rawBuffer, keyword) {
        try {
            const id = `post_${Date.now()}`;
            const rawPath = path.join(__dirname, '../../data', `${id}_raw.jpg`);
            
            fs.writeFileSync(rawPath, rawBuffer);
            
            const approvals = this.getApprovals();
            approvals.push({
                id,
                status: 'WAITING_RAW_APPROVAL',
                news,
                raw_path: rawPath,
                keyword,
                timestamp: new Date().toISOString()
            });
            
            this.saveApprovals(approvals);
            return id;
        } catch (e) {
            logger.error(`❌ Erro ao criar aprovação pendente: ${e.message}`);
            return null;
        }
    }

    /**
     * Atualiza o estado para aguardando aprovação da arte final.
     */
    async updateToFinal(id, finalBuffer, productionText) {
        try {
            let approvals = this.getApprovals();
            const idx = approvals.findIndex(a => a.id === id);
            if (idx === -1) return false;

            const finalPath = path.join(__dirname, '../../data', `${id}_final.jpg`);
            fs.writeFileSync(finalPath, finalBuffer);
            
            approvals[idx].status = 'WAITING_FINAL_APPROVAL';
            approvals[idx].final_path = finalPath;
            approvals[idx].production_text = productionText;
            
            this.saveApprovals(approvals);
            return true;
        } catch (e) {
            logger.error(`❌ Erro ao atualizar para final: ${e.message}`);
            return false;
        }
    }

    getApprovals() {
        if (!fs.existsSync(APPROVALS_PATH)) return [];
        try {
            return JSON.parse(fs.readFileSync(APPROVALS_PATH, 'utf8'));
        } catch (e) { return []; }
    }

    saveApprovals(data) {
        fs.writeFileSync(APPROVALS_PATH, JSON.stringify(data, null, 2));
    }

    getPending() {
        return this.getApprovals().find(a => a.status !== 'POSTED' && a.status !== 'REJECTED');
    }

    resolveApproval(id, status) {
        let approvals = this.getApprovals();
        const idx = approvals.findIndex(a => a.id === id);
        if (idx !== -1) {
            approvals[idx].status = status;
            this.saveApprovals(approvals);
        }
    }
}

module.exports = new ApprovalModule();
