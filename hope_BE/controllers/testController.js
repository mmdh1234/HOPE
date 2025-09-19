const { spawn } = require('child_process');
const path = require('path');

// 실행 중인 프로세스 저장
const runningProcs = {}; // { userId: ChildProcess }

exports.startTest = (req, res) => {
    const userId = String(req.user.id);

    if (runningProcs[userId]) {
        return res.status(400).json({ message: '이미 test.py 실행 중입니다.' });
    }

    const scriptPath = path.join(__dirname, '../../hope_Model/test.py');

    // 백그라운드 실행
    const py = spawn('python', [scriptPath, userId], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
    });

    py.stdout.on('data', (data) => {
        console.log(`[test:${userId}] stdout: ${data.toString()}`);
    });

    py.stderr.on('data', (data) => {
        console.error(`[test:${userId}] stderr: ${data.toString()}`);
    });

    py.on('exit', (code) => {
        console.log(`[test:${userId}] 종료 코드: ${code}`);
        delete runningProcs[userId];
    });

    py.unref();
    runningProcs[userId] = py;

    res.json({ ok: true, message: 'test.py 실행됨', pid: py.pid });
};

exports.stopTest = (req, res) => {
    const userId = String(req.user.id);
    const proc = runningProcs[userId];

    if (!proc) {
        return res
            .status(404)
            .json({ ok: false, message: '실행 중인 test.py 없음' });
    }

    try {
        // Windows에서 프로세스 종료
        const kill = spawn('taskkill', ['/PID', proc.pid, '/T', '/F']);
        kill.on('exit', () => {
            delete runningProcs[userId];
            res.json({ ok: true, message: 'test.py 종료 요청 전송됨' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            ok: false,
            message: '종료 실패',
            error: err.message,
        });
    }
};
