// Importing required modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// Loading configuration from a local file
let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Failed to load config.json. Ensure it exists and contains valid JSON.');
    process.exit(1); // Exit the process if config can't be loaded
}

// Exchange rates and currency mappings
const exchangeRates = {
    QAR: 3.65,
    SAR: 3.76,
    EGP: 49.65,
    EUR: 0.95,
    KWD: 0.31,
    BTC: 0.000042
};

const currencyNames = {
    QAR: "قطر",
    SAR: "السعودية",
    EGP: "مصر",
    EUR: "اليورو",
    KWD: "الكويت",
    BTC: "بتكوين"
};

// Initialize the Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Event: Bot ready
client.once('ready', () => {
    console.log('البوت شغال. (Bot is running)');
});

// Event: Message creation handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore bot messages

    // Check if the message is in the configured room
    if (message.guild && config.selectedRoom === message.channel.id) {
        const amount = parseFloat(message.content);

        if (amount && !isNaN(amount)) {
            // Calculate conversions for all currencies
            const conversions = {};
            for (const [currency, rate] of Object.entries(exchangeRates)) {
                conversions[currency] = amount * rate;
            }

            // Build and send the embed with conversion rates
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`تحويل ${amount} دولار أمريكي`)
                .addFields(
                    Object.entries(conversions).map(([currency, value]) => {
                        let icon = ''; // Emoji for the currency
                        switch (currency) {
                            case 'QAR': icon = '🇶🇦'; break;
                            case 'SAR': icon = '🇸🇦'; break;
                            case 'EGP': icon = '🇪🇬'; break;
                            case 'EUR': icon = '🇪🇺'; break;
                            case 'KWD': icon = '🇰🇼'; break;
                            case 'BTC': icon = '₿'; break;
                            default: icon = '';
                        }

                        const countryName = currencyNames[currency] || '';
                        return {
                            name: `${icon} ${countryName} (${currency})`,
                            value: `${value.toFixed(2)} ${currency}`,
                            inline: true
                        };
                    })
                )
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        }
    }

    // Command handling
    if (message.content.startsWith(config.prefix)) {
        const command = message.content.slice(config.prefix.length).trim().toLowerCase();

        // Ensure the user has permission
        if (!config.ownerIds.includes(message.author.id)) {
            return message.reply('ليس لديك الصلاحية لاستخدام هذا الأمر.');
        }

        // Handle `تحديد-روم` command
        if (command.startsWith('تحديد-روم')) {
            const args = command.split(' ');
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

            if (!channel) {
                return message.reply('الرجاء تحديد روم صحيح.');
            }

            config.selectedRoom = channel.id;
            try {
                fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
                message.reply(`تم تحديد الروم: ${channel}`);
            } catch (error) {
                console.error('Error saving configuration:', error);
                message.reply('حدث خطأ أثناء حفظ الإعدادات.');
            }

        // Handle `إزالة-روم` command
        } else if (command === 'إزالة-روم') {
            if (!config.selectedRoom) {
                return message.reply('لا يوجد روم محدد.');
            }

            config.selectedRoom = null;
            try {
                fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
                message.reply('تم إزالة الروم المحدد.');
            } catch (error) {
                console.error('Error updating configuration:', error);
                message.reply('حدث خطأ أثناء التحديث.');
            }

        // Handle `help` command
        } else if (command === 'help') {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('الأوامر المتاحة')
                .setDescription('قائمة الأوامر:')
                .addFields([
                    { name: 'تحديد-روم <روم>', value: 'اختيار روم.' },
                    { name: 'إزالة-روم', value: 'إلغاء تحديد الروم الحالي.' },
                    { name: 'help', value: 'عرض قائمة الأوامر.' }
                ]);
            message.reply({ embeds: [embed] });
        } else {
            message.reply('الأمر غير معروف. حاول مرة أخرى.');
        }
    }
});

// Start the bot with the token from the config
client.login(config.token);
