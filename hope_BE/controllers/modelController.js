const { spawn } = require('child_process');
const path = require('path');

exports.train = async (req, res) => {
    const userId = String(req.user.id);
    const script = path.join(__dirname, '../../hope_Model/user_model.py');
    const py = spawn('python', ['-u', script, userId], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '',
        stderr = '';
    py.stdout.on('data', (d) => (stdout += d));
    py.stderr.on('data', (d) => (stderr += d));

    py.on('close', (code) => {
        if (code !== 0)
            return res
                .status(500)
                .json({ message: 'Training failed', detail: stderr });
        try {
            return res.status(200).json(JSON.parse(stdout));
        } catch {
            return res.status(200).json({ status: 'ok', raw: stdout });
        }
    });
};
