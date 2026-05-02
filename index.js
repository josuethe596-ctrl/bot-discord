const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1499955518725423244';
const GUILD_ID = '1488371938265923705';
const ROL_ID = '1249140217663979622';

// 💰 PRECIOS
const precios = {
  m4: 20000,
  ak47: 3240,
  mp5: 2400,
  escopeta: 2400,
  deagle: 2400,
  tec9: 2000,
  uzi: 2000
};

// 📦 PACKS
const packs = {
  corto: { nombre: 'Corto–Medio', armas: ['Deagle', 'Escopeta'], total: 4500 },
  medio1: { nombre: 'Medio I', armas: ['MP5', 'Escopeta'], total: 4400 },
  medio2: { nombre: 'Medio II', armas: ['Tec-9', 'Escopeta'], total: 4000 },
  medio3: { nombre: 'Medio III', armas: ['Uzi', 'Escopeta'], total: 4000 },
  full1: { nombre: 'Full I', armas: ['M4', 'Deagle', 'MP5', 'Escopeta'], total: 20000 },
  full2: { nombre: 'Full II', armas: ['AK-47', 'Deagle', 'Tec-9', 'Escopeta'], total: 10000 }
};

// 📦 COMANDOS
const commands = [

  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catálogo de armas'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total de armas')
    .addStringOption(o => o.setName('arma1').setDescription('Arma 1').setRequired(true))
    .addStringOption(o => o.setName('arma2').setDescription('Arma 2'))
    .addStringOption(o => o.setName('arma3').setDescription('Arma 3'))
    .addStringOption(o => o.setName('arma4').setDescription('Arma 4'))
    .addStringOption(o => o.setName('arma5').setDescription('Arma 5')),

  new SlashCommandBuilder()
    .setName('pack')
    .setDescription('Ver precio de pack')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de pack')
        .setRequired(true)
        .addChoices(
          { name: 'Corto–Medio', value: 'corto' },
          { name: 'Medio I', value: 'medio1' },
          { name: 'Medio II', value: 'medio2' },
          { name: 'Medio III', value: 'medio3' },
          { name: 'Full I', value: 'full1' },
          { name: 'Full II', value: 'full2' }
        )
    )

].map(c => c.toJSON());

// 📡 REGISTRO
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('Comandos registrados');
});

// 🎮 INTERACCIONES
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 🔒 ROL
  if (!interaction.member.roles.cache.has(ROL_ID)) {
    return interaction.reply({ content: 'No tienes permiso.', ephemeral: true });
  }

  try {

    // 🛒 ARMAMENTO
    if (interaction.commandName === 'armamento') {

      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setTitle('🛒 CATÁLOGO DE ARMAMENTO')
        .setColor(0x2b2d31)
        .setDescription('Selecciona tu armamento disponible')
        .addFields(
          {
            name: '🔫 Arma Premium',
            value: '**M4** — 💰 $20.000',
          },
          {
            name: '⚔️ Armas Disponibles',
            value:
              'AK-47 — $3.240\n' +
              'MP5 — $2.400\n' +
              'Escopeta — $2.400\n' +
              'Deagle — $2.400\n' +
              'Tec-9 — $2.000\n' +
              'Uzi — $2.000',
          },
          {
            name: '📦 Packs',
            value:
              'Corto–Medio — $4.500\n' +
              'Medio I — $4.400\n' +
              'Medio II — $4.000\n' +
              'Medio III — $4.000\n' +
              'Full I — $20.000\n' +
              'Full II — $10.000',
          }
        )
        .setFooter({ text: 'Usa /pago o /pack para calcular' });

      return interaction.editReply({ embeds: [embed] });
    }

    // 💰 PAGO
    if (interaction.commandName === 'pago') {

      await interaction.deferReply();

      const armas = [
        interaction.options.getString('arma1'),
        interaction.options.getString('arma2'),
        interaction.options.getString('arma3'),
        interaction.options.getString('arma4'),
        interaction.options.getString('arma5')
      ];

      let total = 0;
      let lista = [];

      for (let arma of armas) {
        if (!arma) continue;

        arma = arma.toLowerCase();

        if (precios[arma]) {
          total += precios[arma];
          lista.push(`• ${arma.toUpperCase()} — $${precios[arma]}`);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('💰 RESUMEN DE COMPRA')
        .setColor(0x2b2d31)
        .setDescription(lista.join('\n') || 'Sin armas válidas')
        .addFields({
          name: '💵 Total a pagar',
          value: `$${total}`,
        })
        .setFooter({ text: 'Usa /donar y envía comprobante' });

      return interaction.editReply({ embeds: [embed] });
    }

    // 📦 PACK
    if (interaction.commandName === 'pack') {

      await interaction.deferReply();

      const tipo = interaction.options.getString('tipo');
      const pack = packs[tipo];

      const embed = new EmbedBuilder()
        .setTitle('📦 PACK SELECCIONADO')
        .setColor(0x2b2d31)
        .addFields(
          { name: 'Tipo', value: pack.nombre },
          { name: 'Armas', value: pack.armas.join(', ') },
          { name: 'Total', value: `$${pack.total}` }
        )
        .setFooter({ text: 'Usa /donar para completar la compra' });

      return interaction.editReply({ embeds: [embed] });
    }

  } catch (error) {
    console.error(error);

    if (interaction.deferred) {
      interaction.editReply('Ocurrió un error.');
    } else {
      interaction.reply({ content: 'Error inesperado.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
