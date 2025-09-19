const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const Feature = require('../models/userdata');

exports.collect = async (req, res) => {
    const userId = String(req.user.id);
    if (!userId)
        return res.status(400).json({ message: '잘못된 userId입니다' });

    const script = path.join(__dirname, '../../hope_Model/user_data.py');
    const py = spawn('python', ['-u', script, userId], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    py.stdout.setEncoding('utf8');
    py.stderr.setEncoding('utf8');

    py.stdout.on('data', (d) => (stdout += d));
    py.stderr.on('data', (d) => (stderr += d));

    py.on('error', (err) => {
        console.error('Python 프로세스 실행 오류', err);
        return res.status(500).json({
            message: 'Python 프로세스 실행 오류',
            detail: err.message,
        });
    });

    py.on('close', async (code) => {
        if (code !== 0) {
            console.error('Python 스크립트 오류 출력', stderr);
            return res.status(500).json({
                message: 'Python 스크립트 오류 출력',
                detail: stderr || code,
            });
        }

        // 파이썬은 성공 시 stdout에 JSON을 출력하도록 함
        try {
            const out = JSON.parse(stdout);
            // out should contain { status: 'ok', userId, docId, filePath }
            // 파일 저장 위치를 응답에 포함시키도록 user_data.py에 구현
            return res.status(200).json(out);
        } catch (e) {
            console.error('JSON 구문 분석 오류', e, 'stdout:', stdout);
            return res
                .status(500)
                .json({ message: '잘못된 Python 출력', detail: stdout });
        }
    });
};
