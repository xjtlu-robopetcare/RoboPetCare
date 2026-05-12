const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
const PORT = Number(process.env.PORT || 8001);
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3-vl-plus';
const QWEN_TEXT_MODEL = process.env.QWEN_TEXT_MODEL || 'qwen-plus';
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || DASHSCOPE_BASE_URL;
const MAX_FRAME_COUNT = Number(process.env.MAX_AI_FRAMES || 12);
const MAX_UPLOAD_MB = Number(process.env.MAX_VIDEO_UPLOAD_MB || 80);

const runtimeRoot = process.env.RUNTIME_DATA_DIR || path.join(os.tmpdir(), 'stitch_robopet_health_manager');
const uploadRoot = path.join(runtimeRoot, 'uploads');
const frameRoot = path.join(runtimeRoot, 'frames');
fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(frameRoot, { recursive: true });

const upload = multer({
    dest: uploadRoot,
    limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));

app.get('/api/health', (req, res) => {
    const provider = getAiProvider();
    res.json({
        ok: true,
        aiConfigured: provider !== 'none',
        provider,
        model: provider === 'dashscope' ? QWEN_MODEL : OPENAI_MODEL,
        textModel: provider === 'dashscope' ? QWEN_TEXT_MODEL : OPENAI_MODEL,
        baseUrl: provider === 'dashscope' ? QWEN_BASE_URL : undefined,
        runtimeRoot
    });
});

app.post('/api/ai-chat', async (req, res) => {
    try {
        const provider = getAiProvider();
        if (provider === 'none') {
            return res.status(503).json({ error: 'No AI API key is configured. Set DASHSCOPE_API_KEY or OPENAI_API_KEY.' });
        }

        const message = String(req.body?.message || '').trim();
        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const prompt = buildPetChatPrompt({
            message,
            petProfile: req.body?.petProfile || {},
            videoAnalysis: req.body?.videoAnalysis || null,
            lang: req.body?.lang === 'zh' ? 'zh' : 'en'
        });

        const reply = await generateTextWithProvider({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.35,
            maxTokens: 900
        });

        res.json({
            source: provider,
            model: provider === 'dashscope' ? QWEN_TEXT_MODEL : OPENAI_MODEL,
            reply: String(reply || '').trim()
        });
    } catch (err) {
        console.error('[ai-chat]', err);
        res.status(500).json({ error: 'AI chat failed.', detail: err.message });
    }
});

app.post('/api/pet-feeding-advice', async (req, res) => {
    try {
        const provider = getAiProvider();
        if (provider === 'none') {
            return res.status(503).json({ error: 'No AI API key is configured. Set DASHSCOPE_API_KEY or OPENAI_API_KEY.' });
        }

        const prompt = buildFeedingAdvicePrompt({
            petProfile: req.body?.petProfile || {},
            videoAnalysis: req.body?.videoAnalysis || null,
            dailyLog: req.body?.dailyLog || [],
            lang: req.body?.lang === 'zh' ? 'zh' : 'en'
        });

        const text = await generateTextWithProvider({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.25,
            maxTokens: 1200
        });

        const parsed = parseJsonOutput(text);
        res.json({
            source: provider,
            model: provider === 'dashscope' ? QWEN_TEXT_MODEL : OPENAI_MODEL,
            ...normalizeFeedingAdvice(parsed)
        });
    } catch (err) {
        console.error('[pet-feeding-advice]', err);
        res.status(500).json({ error: 'Pet feeding advice failed.', detail: err.message });
    }
});

app.post('/api/analyze-pet-video', requireAiProvider, upload.single('video'), async (req, res) => {
    let videoPath = req.file?.path;
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const outDir = path.join(frameRoot, runId);

    try {
        const provider = getAiProvider();
        if (provider === 'none') {
            return res.status(503).json({ error: 'No AI API key is configured. Set DASHSCOPE_API_KEY or OPENAI_API_KEY.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded.' });
        }

        fs.mkdirSync(outDir, { recursive: true });
        const metadata = await readVideoMetadata(videoPath);
        await extractFrames(videoPath, outDir);

        const frameFiles = fs.readdirSync(outDir)
            .filter(file => file.toLowerCase().endsWith('.jpg'))
            .sort()
            .slice(0, MAX_FRAME_COUNT);

        if (!frameFiles.length) {
            return res.status(422).json({ error: 'Could not extract frames from this video.' });
        }

        const frameInputs = frameFiles.map((file, index) => {
            const imagePath = path.join(outDir, file);
            const base64 = fs.readFileSync(imagePath).toString('base64');
            const timestamp = estimateTimestamp(index, frameFiles.length, metadata.durationSec);
            return {
                timestamp,
                input: {
                    type: 'input_image',
                    image_url: `data:image/jpeg;base64,${base64}`,
                    detail: 'low'
                }
            };
        });

        const aiResult = await analyzeFramesWithProvider({
            frameInputs,
            metadata,
            fileName: req.file.originalname
        });

        res.json({
            source: provider,
            model: provider === 'dashscope' ? QWEN_MODEL : OPENAI_MODEL,
            frameCount: frameInputs.length,
            durationSec: metadata.durationSec,
            width: metadata.width,
            height: metadata.height,
            ...aiResult
        });
    } catch (err) {
        console.error('[analyze-pet-video]', err);
        res.status(500).json({
            error: 'Video AI analysis failed.',
            detail: err.message
        });
    } finally {
        cleanupPath(videoPath);
        cleanupPath(outDir, true);
    }
});

function readVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, data) => {
            if (err) return reject(err);
            const videoStream = data.streams?.find(stream => stream.codec_type === 'video') || {};
            resolve({
                durationSec: Number(data.format?.duration || 0),
                width: Number(videoStream.width || 0),
                height: Number(videoStream.height || 0)
            });
        });
    });
}

function getAiProvider() {
    if (process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || isLocalBaseUrl(QWEN_BASE_URL)) return 'dashscope';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return 'none';
}

function requireAiProvider(req, res, next) {
    if (getAiProvider() === 'none') {
        return res.status(503).json({ error: 'No AI API key or local Qwen endpoint is configured. Set DASHSCOPE_API_KEY, QWEN_API_KEY, or QWEN_BASE_URL/DASHSCOPE_BASE_URL to a local OpenAI-compatible server.' });
    }
    next();
}

function isLocalBaseUrl(value) {
    try {
        const url = new URL(value);
        return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch (err) {
        return false;
    }
}

function buildProviderHeaders(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return headers;
}

function extractFrames(videoPath, outDir) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                '-vf', `fps=1/2,scale=512:-1`,
                '-frames:v', String(MAX_FRAME_COUNT),
                '-q:v', '3'
            ])
            .output(path.join(outDir, 'frame-%03d.jpg'))
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

async function analyzeFramesWithProvider({ frameInputs, metadata, fileName }) {
    const frameTimeline = frameInputs.map((frame, index) => `Frame ${index + 1}: ${formatClock(frame.timestamp)}`).join('\n');
    const prompt = buildPetVideoPrompt({ frameTimeline, metadata, fileName });
    const provider = getAiProvider();

    if (provider === 'dashscope') {
        return analyzeFramesWithDashScope({ frameInputs, prompt });
    }

    return analyzeFramesWithOpenAI({ frameInputs, prompt });
}

async function generateTextWithProvider({ messages, temperature = 0.3, maxTokens = 1000 }) {
    const provider = getAiProvider();
    if (provider === 'dashscope') {
        return generateTextWithDashScope({ messages, temperature, maxTokens });
    }
    return generateTextWithOpenAI({ messages, temperature, maxTokens });
}

async function generateTextWithDashScope({ messages, temperature, maxTokens }) {
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
    const response = await fetch(`${QWEN_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: buildProviderHeaders(apiKey),
        body: JSON.stringify({
            model: QWEN_TEXT_MODEL,
            messages,
            temperature,
            max_tokens: maxTokens
        })
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error?.message || `DashScope text request failed with ${response.status}`);
    }
    return payload.choices?.[0]?.message?.content || '';
}

async function generateTextWithOpenAI({ messages, temperature, maxTokens }) {
    const input = messages.map(message => ({
        role: message.role,
        content: [{ type: 'input_text', text: message.content }]
    }));

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            input,
            temperature,
            max_output_tokens: maxTokens
        })
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error?.message || `OpenAI text request failed with ${response.status}`);
    }
    return extractOutputText(payload);
}

async function analyzeFramesWithOpenAI({ frameInputs, prompt }) {
    const content = [
        { type: 'input_text', text: prompt },
        ...frameInputs.map(frame => frame.input)
    ];

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            input: [{ role: 'user', content }],
            max_output_tokens: 1200
        })
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error?.message || `OpenAI request failed with ${response.status}`);
    }

    const text = extractOutputText(payload);
    const parsed = parseJsonOutput(text);
    return normalizeAiResult(parsed);
}

async function analyzeFramesWithDashScope({ frameInputs, prompt }) {
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
    const content = [
        { type: 'text', text: prompt },
        ...frameInputs.map(frame => ({
            type: 'image_url',
            image_url: { url: frame.input.image_url }
        }))
    ];

    const response = await fetch(`${QWEN_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: buildProviderHeaders(apiKey),
        body: JSON.stringify({
            model: QWEN_MODEL,
            messages: [{ role: 'user', content }],
            temperature: 0.2
        })
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error?.message || `DashScope request failed with ${response.status}`);
    }

    const text = payload.choices?.[0]?.message?.content || '';
    const parsed = parseJsonOutput(text);
    return normalizeAiResult(parsed);
}

function buildPetVideoPrompt({ frameTimeline, metadata, fileName }) {
    return [
        'You are analyzing sampled frames from a pet activity video for a consumer pet-care app.',
        'Return JSON only. Do not wrap the JSON in markdown.',
        'This is not a veterinary diagnosis. Only describe visible behavior and practical monitoring suggestions.',
        `Video file: ${fileName}`,
        `Approx duration: ${Math.round(metadata.durationSec || 0)} seconds`,
        'Frame timestamps:',
        frameTimeline,
        '',
        'Classify visible behavior into Rest, Movement, Playing, Eating, or Possible concern.',
        'Use the timestamps above to create a concise timeline.',
        'Return this JSON schema:',
        JSON.stringify({
            summary: 'Short user-facing summary.',
            status: 'normal | watch | active',
            confidence: 'low | medium | high',
            behavior_mix: {
                movement: 0,
                rest: 0,
                playing: 0,
                eating: 0
            },
            events: [
                {
                    start: '00:00',
                    end: '00:04',
                    label: 'Rest',
                    confidence: 'low | medium | high',
                    note: 'Visible observation.'
                }
            ],
            risk_flags: [],
            next_step: 'Practical next step.'
        })
    ].join('\n');
}

function buildPetChatPrompt({ message, petProfile, videoAnalysis, lang }) {
    return [
        'You are RoboPetCare AI, a practical pet-care assistant.',
        'Do not diagnose disease. Give everyday care suggestions and say when a veterinarian should be contacted.',
        lang === 'zh' ? 'Answer in concise Simplified Chinese.' : 'Answer concisely in English.',
        'Use the provided pet profile and latest video analysis when relevant.',
        '',
        'Pet profile JSON:',
        safeJson(petProfile),
        '',
        'Latest video analysis JSON:',
        safeJson(videoAnalysis || {}),
        '',
        'User question:',
        message
    ].join('\n');
}

function buildFeedingAdvicePrompt({ petProfile, videoAnalysis, dailyLog, lang }) {
    const schema = {
        summary: 'One short user-facing summary.',
        calorie_note: 'Plain-language feeding amount note without pretending to be a medical prescription.',
        feeding_plan: [
            { time: 'Morning', amount: 'Example amount', reason: 'Why this timing/amount helps.' }
        ],
        adjustments: ['Practical adjustment based on pet profile and visible activity.'],
        watch_items: ['What the owner should monitor.'],
        vet_note: 'When to contact a veterinarian.'
    };

    return [
        'You are creating feeding guidance for a consumer pet-care app.',
        'Return JSON only. Do not wrap the JSON in markdown.',
        'This is not a veterinary diagnosis or prescription. Be conservative and practical.',
        lang === 'zh' ? 'Write all user-facing values in Simplified Chinese.' : 'Write all user-facing values in English.',
        'Use the pet profile, recent video behavior analysis, and saved clip log if available.',
        'If video analysis is missing, say the advice is based on profile only and ask for a video before making activity-based changes.',
        '',
        'Pet profile JSON:',
        safeJson(petProfile),
        '',
        'Latest video analysis JSON:',
        safeJson(videoAnalysis || {}),
        '',
        'Saved daily clip log JSON:',
        safeJson(Array.isArray(dailyLog) ? dailyLog.slice(-6) : []),
        '',
        'Return this JSON schema:',
        JSON.stringify(schema)
    ].join('\n');
}

function normalizeFeedingAdvice(result) {
    return {
        summary: String(result.summary || 'Feeding guidance generated from the available profile and activity data.'),
        calorie_note: String(result.calorie_note || 'Use this as a practical starting point and adjust with your veterinarian for medical needs.'),
        feeding_plan: normalizeStringObjectList(result.feeding_plan, ['time', 'amount', 'reason']).slice(0, 4),
        adjustments: normalizeStringList(result.adjustments).slice(0, 6),
        watch_items: normalizeStringList(result.watch_items).slice(0, 6),
        vet_note: String(result.vet_note || 'Contact a veterinarian if appetite changes suddenly, vomiting occurs, or low energy persists.')
    };
}

function normalizeStringList(value) {
    if (!Array.isArray(value)) return [];
    return value.map(item => String(item || '').trim()).filter(Boolean);
}

function normalizeStringObjectList(value, keys) {
    if (!Array.isArray(value)) return [];
    return value.map(item => {
        const out = {};
        for (const key of keys) out[key] = String(item?.[key] || '').trim();
        return out;
    }).filter(item => Object.values(item).some(Boolean));
}

function safeJson(value) {
    try {
        return JSON.stringify(value || {}, null, 2);
    } catch (err) {
        return '{}';
    }
}

function extractOutputText(payload) {
    if (payload.output_text) return payload.output_text;
    const parts = [];
    for (const item of payload.output || []) {
        for (const content of item.content || []) {
            if (content.text) parts.push(content.text);
        }
    }
    return parts.join('\n').trim();
}

function parseJsonOutput(text) {
    const cleaned = String(text || '')
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw err;
    }
}

function normalizeAiResult(result) {
    const mix = result.behavior_mix || {};
    const movement = clampPct(mix.movement);
    const rest = clampPct(mix.rest);
    const playing = clampPct(mix.playing);
    const eating = clampPct(mix.eating);
    const total = Math.max(1, movement + rest + playing + eating);

    return {
        summary: String(result.summary || 'AI analyzed the sampled pet activity frames.'),
        status: ['normal', 'watch', 'active'].includes(result.status) ? result.status : 'normal',
        confidence: ['low', 'medium', 'high'].includes(result.confidence) ? result.confidence : 'medium',
        behavior_mix: {
            movement: Math.round((movement / total) * 100),
            rest: Math.round((rest / total) * 100),
            playing: Math.round((playing / total) * 100),
            eating: Math.round((eating / total) * 100)
        },
        events: Array.isArray(result.events) ? result.events.slice(0, 8).map(normalizeEvent) : [],
        risk_flags: Array.isArray(result.risk_flags) ? result.risk_flags.map(String).slice(0, 5) : [],
        next_step: String(result.next_step || 'Continue collecting clips across different times of day.')
    };
}

function normalizeEvent(event) {
    const labels = {
        rest: 'Rest',
        movement: 'Movement',
        playing: 'Playing',
        eating: 'Eating',
        'possible concern': 'Possible concern'
    };
    const rawLabel = String(event.label || 'Movement').toLowerCase();
    return {
        start: String(event.start || '00:00'),
        end: String(event.end || event.start || '00:03'),
        label: labels[rawLabel] || 'Movement',
        confidence: ['low', 'medium', 'high'].includes(event.confidence) ? event.confidence : 'medium',
        note: String(event.note || 'Visible behavior identified from sampled frames.')
    };
}

function estimateTimestamp(index, count, durationSec) {
    if (!Number.isFinite(durationSec) || durationSec <= 0) return index * 2;
    if (count <= 1) return 0;
    return Math.round((durationSec * index) / (count - 1));
}

function formatClock(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function clampPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function cleanupPath(targetPath, recursive = false) {
    if (!targetPath) return;
    try {
        fs.rmSync(targetPath, { force: true, recursive });
    } catch (err) {
        console.warn('[cleanup failed]', targetPath, err.message);
    }
}

app.use((err, req, res, next) => {
    if (!err) return next();
    console.error('[request failed]', err);
    const status = err instanceof multer.MulterError ? 400 : 500;
    res.status(status).json({
        error: err instanceof multer.MulterError ? 'Video upload failed.' : 'Server request failed.',
        detail: err.message
    });
});

app.listen(PORT, () => {
    console.log(`RoboPetCare AI server running at http://127.0.0.1:${PORT}/app.html`);
    console.log(`AI endpoint: http://127.0.0.1:${PORT}/api/analyze-pet-video`);
    console.log(`Chat endpoint: http://127.0.0.1:${PORT}/api/ai-chat`);
    console.log(`Feeding advice endpoint: http://127.0.0.1:${PORT}/api/pet-feeding-advice`);
});
