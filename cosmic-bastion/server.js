const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3456;
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize scores file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Get high scores
app.get('/api/scores', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const sorted = data.scores.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted);
  } catch {
    res.json([]);
  }
});

// Submit a score
app.post('/api/scores', (req, res) => {
  try {
    const { name, score, wave } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score data' });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data.scores.push({
      name: name.slice(0, 20),
      score,
      wave: wave || 0,
      date: new Date().toISOString()
    });
    // Keep only top 100
    data.scores.sort((a, b) => b.score - a.score);
    data.scores = data.scores.slice(0, 100);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, rank: data.scores.findIndex(s => s.score === score && s.name === name) + 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Get wave/level config (for extensibility)
app.get('/api/config', (req, res) => {
  res.json({
    towers: [
      { id: 'laser', name: '激光塔', cost: 50, damage: 15, range: 4, fireRate: 0.5, color: '#00ffff' },
      { id: 'plasma', name: '等离子炮', cost: 100, damage: 40, range: 3, fireRate: 1.5, color: '#ff00ff' },
      { id: 'gravity', name: '引力井', cost: 150, damage: 5, range: 5, fireRate: 0.1, color: '#8800ff', slow: 0.5 },
      { id: 'nova', name: '新星炮', cost: 200, damage: 80, range: 6, fireRate: 3, color: '#ffaa00' }
    ],
    waves: [
      { wave: 1, enemies: [{ type: 'asteroid', count: 8, interval: 1.5 }] },
      { wave: 2, enemies: [{ type: 'asteroid', count: 10, interval: 1.2 }, { type: 'scout', count: 3, interval: 2 }] },
      { wave: 3, enemies: [{ type: 'asteroid', count: 12, interval: 1 }, { type: 'scout', count: 5, interval: 1.5 }] },
      { wave: 4, enemies: [{ type: 'scout', count: 8, interval: 1 }, { type: 'cruiser', count: 2, interval: 3 }] },
      { wave: 5, enemies: [{ type: 'asteroid', count: 15, interval: 0.8 }, { type: 'cruiser', count: 4, interval: 2 }] },
      { wave: 6, enemies: [{ type: 'cruiser', count: 6, interval: 1.5 }, { type: 'scout', count: 10, interval: 0.8 }] },
      { wave: 7, enemies: [{ type: 'asteroid', count: 20, interval: 0.5 }, { type: 'cruiser', count: 5, interval: 1.5 }, { type: 'titan', count: 1, interval: 5 }] },
      { wave: 8, enemies: [{ type: 'cruiser', count: 10, interval: 1 }, { type: 'titan', count: 2, interval: 4 }] },
      { wave: 9, enemies: [{ type: 'scout', count: 20, interval: 0.4 }, { type: 'cruiser', count: 8, interval: 1 }, { type: 'titan', count: 3, interval: 3 }] },
      { wave: 10, enemies: [{ type: 'titan', count: 5, interval: 2 }, { type: 'cruiser', count: 15, interval: 0.6 }, { type: 'asteroid', count: 30, interval: 0.3 }] }
    ],
    enemies: {
      asteroid: { name: '陨石舰', hp: 60, speed: 1.2, reward: 10, color: '#888888' },
      scout: { name: '侦察机', hp: 40, speed: 2.0, reward: 15, color: '#00ff88' },
      cruiser: { name: '巡洋舰', hp: 200, speed: 0.8, reward: 30, color: '#ff4444' },
      titan: { name: '宇宙泰坦', hp: 800, speed: 0.5, reward: 100, color: '#ff00ff' }
    }
  });
});

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌌 Cosmic Bastion server running at http://localhost:${PORT}`);
});
