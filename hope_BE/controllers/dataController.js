// hope_BE/controllers/dataController.js
const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Feature = require('../models/userdata');

function runPy(script, args = []) {
    return new Promise((resolve, reject) => {
        const py = spawn('python', ['-u', script, ...args], {
            cwd: path.dirname(script), // 👈 실행 디렉토리를 script가 있는 폴더로 고정
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '',
            stderr = '';
        py.stdout.setEncoding('utf8');
        py.stderr.setEncoding('utf8');
        py.stdout.on('data', (d) => (stdout += d));
        py.stderr.on('data', (d) => (stderr += d));
        py.on('error', (err) => reject({ stage: 'spawn', err }));
        py.on('close', (code) =>
            code === 0
                ? resolve({ stdout, stderr })
                : reject({ stage: 'exit', code, stdout, stderr })
        );
    });
}

exports.saveFromWeb = async (req, res) => {
    const userId = String(req.user.id);
    const {
        features,
        labels,
        feature_schema_id = 'v3_iris_7_features',
        feat_names,
    } = req.body || {};

    if (!userId) return res.status(400).json({ message: '잘못된 userId' });

    // 기본 유효성
    if (!Array.isArray(features) || !Array.isArray(labels)) {
        return res
            .status(400)
            .json({ message: 'features/labels가 배열이 아닙니다.' });
    }
    if (features.length !== labels.length) {
        return res
            .status(400)
            .json({ message: 'features와 labels 길이가 다릅니다.' });
    }
    if (features.length < 30) {
        return res.status(400).json({ message: '샘플 부족(최소 30)' });
    }

    // (선택) 각 feature 차원 검사: 7D인지
    const dimOk = features.every(
        (f) => Array.isArray(f) && f.length === 7 && f.every(Number.isFinite)
    );
    if (!dimOk) {
        return res
            .status(400)
            .json({ message: '각 feature는 길이 7의 숫자 배열이어야 합니다.' });
    }

    try {
        // 1) DB upsert (Python과 동일 컬렉션명)
        const doc = {
            userId,
            features,
            labels,
            feature_schema_id,
            feat_names: feat_names || [
                'ear_l',
                'ear_r',
                'pitch',
                'gL_h',
                'gR_h',
                'gL_v',
                'gR_v',
            ],
        };
        await Feature.updateOne(
            { userId },
            {
                $set: doc,
                $setOnInsert: { createdAt: new Date() },
                $currentDate: { updatedAt: true },
            },
            { upsert: true }
        );

        // 2) 학습 실행 (동기)
        const modelDir = path.join(__dirname, '../../hope_Model');
        const r = await runPy(path.join(modelDir, 'user_model.py'), [
            userId,
            'train',
        ]);

        // 3) 성공 판정
        let ok = false;
        try {
            const j = JSON.parse((r.stdout || '').trim());
            ok = j?.status === 'ok' || j?.model_saved;
        } catch {
            ok = /USERMODEL_OK/i.test(r.stdout || '');
        }
        if (!ok) {
            console.error('❌ user_model.py stderr:', r.stderr);
            return res.status(500).json({
                message: '모델 학습 실패',
                detail: r.stdout || r.stderr,
            });
        }

        return res.json({ ok: true, next: '/main' });
    } catch (e) {
        console.error('❌ saveFromWeb 오류 상세:', e);
        return res.status(500).json({
            message: '저장/학습 파이프라인 오류',
            detail: e.err?.message || e.message,
            ...(e.code
                ? { code: e.code, stdout: e.stdout, stderr: e.stderr }
                : {}),
        });
    }
};
