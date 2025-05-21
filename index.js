const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();


// Inisialisasi client dengan session tersimpan otomatis
const client = new Client({
    authStrategy: new LocalAuth()
});

// Tampilkan QR code di terminal
client.on('qr', (qr) => {
    console.log('Scan QR code berikut dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Jika berhasil login
client.on('ready', () => {
    console.log('Client siap digunakan!');
    const number = "62895397073311@c.us"; // Ganti dengan nomor tujuan
    const message = "Halo, saya bot nya catur nih";

    client.sendMessage(number, message)
        .then(response => {
            console.log("Pesan berhasil dikirim!");
        })
        .catch(err => {
            console.error("Gagal mengirim pesan:", err);
        });
});

client.on('message', async (msg) => {
    console.log(`Pesan masuk dari ${msg.from}: ${msg.body}`);

    // Cek kalau pesannya dari user, bukan dari bot sendiri
    if (msg.fromMe) return;
    if (!msg.body) return;

    let calltuan = '';
    const fromNumber = '62895397073311';

    const isFromThatNumber = msg.from.includes(fromNumber) || (msg.author && msg.author.includes(fromNumber));
    if (isFromThatNumber) {
        calltuan = 'panggil aku dengan panggilan tuan';
    }
    const isMentioned = msg.mentionedIds.includes(client.info.wid._serialized);
    const isReplyToBot = msg.hasQuotedMsg && (await msg.getQuotedMessage()).fromMe;
    const isFromGroup = msg.from.endsWith('@g.us');
    const isRelevant = isMentioned || isReplyToBot;

    if (isFromGroup && !isRelevant) {
        console.log('Pesan bukan untuk bot, abaikan.');
        return;
    }


    const reply = await getAIResponse(msg.from, msg.body, calltuan);
    msg.reply(reply);
});
const MAX_HISTORY = 10;
const messages = {};
const infome = `
Kamu adalah AI dengan nama carai atau singkatan caro ai,
tugas mu adalahah menjawab pertanyaan yang berkaitan dengan informasi pribadi berikut:
Nama: Catur Hendra
Panggilan: caro
Umur: 21 tahun
Kampus: Universitas Negeri Surabaya
Jurusan: Teknik Informatika
Status: jomblo
Hobi: ngoding, netflix
Pekerjaan: fulltime web developer di printsoft, freelance web developer
Alamat: Surabaya
nommor rekening : 2711505395(bca)
Kepribadian: introvert, humoris, sabar
instagram: @caturhendra_
link portofolio: https://carroo.me
nomor wa: 0895397073311

Aturan menjawab:
1. Jika hanya basa basi, maka jawab dengan santai tanpa memberikan informasi pribadi apapun.
2. Jawablah **hanya** jika pertanyaannya berkaitan dengan informasi pribadi yang ada di atas (seperti nama, umur, kampus, jurusan, kepribadian, minat, atau kontak).
4. Gunakan gaya bahasa santai, kekinian, dan jangan terlalu panjang.
5. Jangan sebut semua informasi sekaligus. Saat mengarahkan ke kontak, cukup pilih satu (boleh IG, WA, atau portofolio).
6. jika dia punya nama panggilan, panggil dia dengan nama itu.

Contoh:
- “Hai“ → Jawab: “Hai, ada yang bisa aku bantu?“
- “Kamu kuliah di mana?” → Jawab: “Aku kuliah di Universitas Negeri Surabaya.”
- “Kamu suka warna apa?” → Jawab: “Wah, soal itu belum pernah aku share, coba tanya aku langsung aja di IG @caturhendra_ ya 😄”

`;



async function getAIResponse(from, userMessage, calltuan = '') {
    try {
        const apiKey = process.env.OPEN_ROUTER_API_KEY;  // Ganti dengan API key mu
        const url = process.env.OPEN_ROUTER_API_URL; // Ganti dengan URL API mu

        // Inisialisasi history jika belum ada
        if (!messages[from]) {
            messages[from] = [
                {
                    role: "system",
                    content: infome
                }
            ];
        }

        // Tambahkan pesan user ke history
        messages[from].push({
            role: "user",
            content: userMessage + '\n' + calltuan
        });

        // Kirim seluruh history chat ke API
        const data = {
            model: process.env.OPEN_ROUTER_MODEL, // Ganti dengan model yang kamu gunakan
            messages: messages[from],
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Ambil balasan AI
        const aiReply = response.data.choices[0].message.content;

        // Simpan balasan AI ke history
        messages[from].push({
            role: "assistant",
            content: aiReply
        });
        const systemPrompt = messages[from][0]; // simpan system prompt
        const recentMessages = messages[from].slice(-MAX_HISTORY); // ambil 10 terakhir
        messages[from] = [systemPrompt, ...recentMessages]; // gabungkan ulang

        return aiReply;

    } catch (error) {
        console.error('Error saat request ke OpenRouter:', error.message);
        return "Maaf, aku sedang ada masalah nih.";
    }
}



client.initialize();
