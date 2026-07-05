import logger from '@/utils/logger';
import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
    EmbedBuilder,
} from 'discord.js';

interface AnalyzeResponse {
    weightedScores?: Record<string, number>;
    identifications?: Record<string, { displayValue: number; percentage: number; stars?: number }>;
    overall?: number;
    itemName?: string;
}

export const data = new SlashCommandSubcommandBuilder()
    .setName('analyze')
    .setDescription('Analyze an encoded item string')
    .addStringOption(opt =>
        opt
            .setName('string')
            .setDescription('The encoded item string')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'analyze') return;

    const itemString = interaction.options.getString('string', true);
    await interaction.deferReply();

    try {
        const response = await fetch('https://api.wynnpool.com/item/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item: itemString }),
        });

        if (!response.ok) {
            throw new Error(`API error ${response.status}`);
        }

        const json = (await response.json()) as AnalyzeResponse;
        // Format all weighted scores
        const weightedScores = Object.entries(json.weightedScores || {})
            .map(([name, value]) => `**${name} Weight:** ${Number(value).toFixed(2)}%`)
            .join('\n');
        // Format stats
        const stats = Object.entries(json.identifications || {})
            .map(([key, value]) => {
                const stars = value.stars ? '\\*'.repeat(value.stars) : '';
                return `${value.displayValue > 0 ? "+" : ""}${value.displayValue}${stars} ${key} [${Number(value.percentage).toFixed(2)}%]`;
            })
            .join('\n');
        // Get overall and item name
        const overall = json.overall ? Number(json.overall).toFixed(2) : 'N/A';
        const itemName = json.itemName || 'Unknown';
        // Build embed
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Wynnpool Weight System' })
            .setTitle('Item weight analysis')
            .setDescription(
                `[Full Weights List](https://weight.wynnpool.com/)\n\n` +
                `${weightedScores}\n\n` +
                `${itemName} ${overall}%\n` +
                stats
            )
            .setColor('#00b0f4')
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
        logger.error(error);
        await interaction.editReply(`❌ Error analyzing item: \`${error.message}\``);
    }
}