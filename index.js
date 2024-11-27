const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');


const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// أسعار العملات (بناءً على الدولار الأمريكي)
const exchangeRates = {
    QAR: 3.65,   // ريال قطري
    SAR: 3.76,   // ريال سعودي
    EGP: 49.65,  // جنيه مصري
    EUR: 0.95,   // يورو
    KWD: 0.31    // دينار كويتي
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', () => {
    console.log('البوت شغال!');
});

client.on('messageCreate', async (message) => {
    
    if (message.author.bot) return;

    
    if (message.guild && config.selectedRoom && message.channel.id === config.selectedRoom) {

        
        const amount = parseFloat(message.content);

        
        if (!isNaN(amount)) {
            // حساب القيم المحولة بناءً على الدولار الأمريكي
            const qatarRiyal = amount * exchangeRates.QAR;
            const saudiRiyal = amount * exchangeRates.SAR;
            const egyptianPound = amount * exchangeRates.EGP;
            const euro = amount * exchangeRates.EUR;
            const kuwaitDinar = amount * exchangeRates.KWD;

            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`تحويل ${amount} دولار أمريكي`)
                .addFields(
                    { name: '🇶🇦 ريال قطري (QAR)', value: `${qatarRiyal.toFixed(2)} QAR`, inline: true },
                    { name: '🇸🇦 ريال سعودي (SAR)', value: `${saudiRiyal.toFixed(2)} SAR`, inline: true },
                    { name: '🇪🇬 جنيه مصري (EGP)', value: `${egyptianPound.toFixed(2)} EGP`, inline: true },
                    { name: '🇪🇺 يورو (EUR)', value: `${euro.toFixed(2)} EUR`, inline: true },
                    { name: '🇰🇼 دينار كويتي (KWD)', value: `${kuwaitDinar.toFixed(2)} KWD`, inline: true }
                )
                .setTimestamp();

            
            message.channel.send({ embeds: [embed] });
        }
    }

    if (message.content.startsWith(config.prefix)) {
        const command = message.content.slice(config.prefix.length).trim().toLowerCase();

        
        if (!config.ownerIds.includes(message.author.id)) {
            return message.reply("عذراً، ليس لديك صلاحية استخدام هذا الأمر.");
        }

        
        if (command.startsWith('تحديد-روم')) {
            const args = command.split(' ');

            
            let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

            if (!channel) {
                return message.reply('الرجاء تحديد روم صحيح عبر منشن أو ID.');
            }

            
            config.selectedRoom = channel.id;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 4));

            message.reply(`تم تحديد الروم: ${channel}`);
        }

        // أمر لإزالة الروم
        if (command === 'إزالة-روم') {
            if (!config.selectedRoom) {
                return message.reply('لم يتم تحديد أي روم بعد.');
            }

            
            config.selectedRoom = null;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 4));

            message.reply('تم إزالة الروم المحدد.');
        }

        
        if (command === 'help') {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('قائمة الأوامر')
                .setDescription('إليك قائمة بكل الأوامر المتاحة مع شرح كل أمر:')
                .addFields(
                    { name: '-تحديد-روم <منشن الروم/ID الروم>', value: 'تحديد الروم الذي سيتم إرسال نتائج التحويل إليه.' },
                    { name: '-إزالة-روم', value: 'إزالة الروم المحدد. سيتم مسح الروم المخزن في النظام.' },
                    { name: '-help', value: 'عرض قائمة بكل الأوامر مع شرحها.' }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        }
    }
});

client.login(config.token);
