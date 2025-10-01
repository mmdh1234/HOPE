// hope_BE/controllers/dataController.js
const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Feature = require('../models/userdata');
const UserModel = require('../models/userModel');

function runPy(script, args = []) {
    return new Promise((resolve, reject) => {
        const py = spawn('python', ['-u', script, ...args], {
            cwd: path.dirname(script),
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

    // 각 feature 차원 검사: 7D인지
    const dimOk = features.every(
        (f) => Array.isArray(f) && f.length === 7 && f.every(Number.isFinite)
    );
    if (!dimOk) {
        return res
            .status(400)
            .json({ message: '각 feature는 길이 7의 숫자 배열이어야 합니다.' });
    }

    try {
        // 1) DB upsert
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
        // 3) Python 스크립트의 출력(stdout)을 파싱하여 DB에 저장
        try {
            const modelJsonString = r.stdout.trim();
            if (!modelJsonString) {
                // 스크립트에서 아무 출력도 없는 경우 에러 처리
                throw new Error('Python 스크립트에서 모델 출력이 없습니다.');
            }
            const modelData = JSON.parse(modelJsonString);

            // Python 스크립트 내에서 에러가 발생했는지 확인
            if (modelData.status === 'error') {
                throw new Error(
                    `모델 학습 실패: ${modelData.detail || '알 수 없는 오류'}`
                );
            }

            // MongoDB의 'user_models' 컬렉션에 모델 데이터 저장 (upsert: true 사용)
            await UserModel.updateOne(
                { userId: userId },
                {
                    $set: {
                        modelData: modelData,
                        meta: {
                            trainedAt: new Date(),
                            schema: feature_schema_id,
                        },
                    },
                    $setOnInsert: { createdAt: new Date() },
                    $currentDate: { updatedAt: true },
                },
                { upsert: true }
            );
        } catch (parseError) {
            console.error(
                '❌ Python 스크립트 출력 파싱 또는 DB 저장 실패:',
                parseError.message
            );
            console.error('--- Python stdout ---');
            console.error(r.stdout);
            console.error('--- Python stderr ---');
            console.error(r.stderr);
            console.error('---------------------');
            return res.status(500).json({
                message: '모델 학습 결과 처리 실패',
                detail: r.stderr || r.stdout || '파이썬 스크립트 실행 오류',
            });
        }

        return res.json({ ok: true, next: '/main' });
    } catch (e) {
        console.error('❌ saveFromWeb 파이프라인 오류 상세:', e);
        return res.status(500).json({
            message: '저장/학습 파이프라인 전체 오류',
            detail: e.err?.message || e.message,
            ...(e.code
                ? { code: e.code, stdout: e.stdout, stderr: e.stderr }
                : {}),
        });
    }
};
