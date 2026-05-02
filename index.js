const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1499955518725423244';
const GUILD_ID = '1488371938265923705';
const ROL_ID = '1490534612793823282';

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

// 📦 COMANDOS (ARREGLADOS)
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
        .setDescription('Tipo de pack') // 🔥 ESTA LÍNEA ERA CLAVE
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

  if (!interaction.member.roles.cache.has(ROL_ID)) {
    return interaction.reply({ content: 'No tienes permiso.', ephemeral: true });
  }

  try {

    // ARMAMENTO
    if (interaction.commandName === 'armamento') {

      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setTitle('📦 Catálogo de Armamento')
        .setColor(0xffffff)
        .addFields(
          { name: 'M4', value: '$20.000' },
          {
            name: 'Armas',
            value:
              'AK-47 — $3.240\nMP5 — $2.400\nEscopeta — $2.400\nDeagle — $2.400\nTec-9 — $2.000\nUzi — $2.000'
          }
        );

      return interaction.editReply({ embeds: [embed] });
    }

    // PAGO
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
      let usadas = [];

      for (let arma of armas) {
        if (!arma) continue;
        arma = arma.toLowerCase();

        if (precios[arma]) {
          total += precios[arma];
          usadas.push(arma);
        }
      }

      return interaction.editReply(`Armas: ${usadas.join(', ')}\nTotal: $${total}`);
    }

    // PACK
    if (interaction.commandName === 'pack') {

      await interaction.deferReply();

      const tipo = interaction.options.getString('tipo');
      const pack = packs[tipo];

      return interaction.editReply(
        `📦 ${pack.nombre}\nArmas: ${pack.armas.join(', ')}\nTotal: $${pack.total}`
      );
    }

  } catch (err) {
    console.error(err);

    if (interaction.deferred) {
      interaction.editReply('Error.');
    } else {
      interaction.reply({ content: 'Error.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
