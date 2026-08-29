import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Field "message" wajib diisi' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Sisipkan data terkini dari dashboard (kalau ada) supaya jawaban AI relevan
        // dengan kondisi lahan gambut saat ini, bukan cuma jawaban umum.
        let prompt = message;
        if (context && context.data) {
            const d = context.data;
            const c = context.computed || {};
            prompt = `Kamu adalah Asisten AI untuk sistem prediksi kebakaran lahan gambut (PEAT AI).
Data sensor & skor risiko saat ini:
- Suhu: ${d.suhu ?? '-'}°C
- Kelembaban udara: ${d.kelembaban_udara ?? '-'}%
- Kelembaban tanah: ${d.kelembaban_tanah ?? '-'}%
- Tinggi Muka Air (TMA): ${c.tma ?? '-'} cm
- Curah hujan 7 hari: ${c.total7 ?? '-'} mm
- Skor risiko kebakaran: ${c.score !== undefined ? Math.round(c.score) : '-'}/100 (kategori: ${c.level ?? '-'})
- Hari kering berturut-turut: ${c.dryStreak ?? '-'} hari

Pertanyaan user: ${message}

Jawab dalam Bahasa Indonesia, ringkas, jelas, dan actionable. Kalau relevan, kaitkan jawabanmu dengan data di atas.`;
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
