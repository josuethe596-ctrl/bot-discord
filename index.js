const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = 'TU_CLIENT_ID';
const GUILD_ID = 'TU_SERVER_ID';
const ROL_ID = 'TU_ROL_ID';

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
  corto: { armas: ['deagle', 'escopeta'], total: 4500 },
  medio1: { armas: ['mp5', 'escopeta'], total: 4400 },
  medio2: { armas: ['tec9', 'escopeta'], total: 4000 },
  medio3: { armas: ['uzi', 'escopeta'], total: 4000 },
  full1: { armas: ['m4', 'deagle', 'mp5', 'escopeta'], total: 20000 },
  full2: { armas: ['ak47', 'deagle', 'tec9', 'escopeta'], total: 10000 }
};

// 📦 COMANDOS
const commands = [

  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catálogo completo'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular armas')
    .addStringOption(o => o.setName('arma1').setRequired(true))
    .addStringOption(o => o.setName('arma2'))
    .addStringOption(o => o.setName('arma3'))
    .addStringOption(o => o.setName('arma4'))
    .addStringOption(o => o.setName('arma5')),

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
});

// 🎮 INTERACCIONES
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(ROL_ID)) {
    return interaction.reply({ content: 'No tienes permiso.', ephemeral: true });
  }

  // 📦 ARMAMENTO
  if (interaction.commandName === 'armamento') {

    const embed = new EmbedBuilder()
      .setTitle('📦 Catálogo de Armamento')
      .setColor(0xffffff)
      .addFields(
        { name: 'M4', value: 'Disponible desde PVT\n💰 $20.000' },
        {
          name: 'Armas disponibles',
          value:
            'AK-47 — $3.240\n' +
            'MP5 — $2.400\n' +
            'Escopeta — $2.400\n' +
            'Deagle — $2.400\n' +
            'Tec-9 — $2.000\n' +
            'Uzi — $2.000'
        },
        {
          name: 'Packs',
          value:
            'Corto–Medio — $4.500\n' +
            'Medio I — $4.400\n' +
            'Medio II — $4.000\n' +
            'Medio III — $4.000\n' +
            'Full I — $20.000\n' +
            'Full II — $10.000'
        }
      );

    return interaction.reply({ embeds: [embed] });
  }

  // 💰 PAGO
  if (interaction.commandName === 'pago') {

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

    return interaction.reply(
      `Armas: ${usadas.join(', ')}\n💰 Total: $${total}`
    );
  }

  // 📦 PACK
  if (interaction.commandName === 'pack') {

    const tipo = interaction.options.getString('tipo');
    const pack = packs[tipo];

    return interaction.reply(
      `📦 Pack seleccionado: ${tipo}\nArmas: ${pack.armas.join(', ')}\n💰 Total: $${pack.total}`
    );
  }

});

client.login(TOKEN);
