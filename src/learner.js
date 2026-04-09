const fs = require('fs');
const path = require('path');

const historyPath = path.join(__dirname, '..', 'data', 'performance.json');

function recordPost(hour, postId) {
    let data = {};
    if (fs.existsSync(historyPath)) {
        try {
            data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch (e) { data = {}; }
    }
    if (!data[hour]) {
        data[hour] = { count: 0, posts: [] };
    }
    data[hour].count++;
    data[hour].posts.push(postId);
    fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
}

function getBestHours() {
    if (!fs.existsSync(historyPath)) return [8, 11, 14, 17, 20];
    try {
        const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        const hours = Object.keys(data).sort((a,b) => data[b].count - data[a].count).slice(0,5).map(h => parseInt(h));
        return hours.length > 0 ? hours : [8, 11, 14, 17, 20];
    } catch (e) { return [8, 11, 14, 17, 20]; }
}

module.exports = { recordPost, getBestHours };
