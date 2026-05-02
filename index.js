const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot activo');
});

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log('Web activa');
});

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1499918194209460275';
const GUILD_ID = '1123790874741047356';
const rolID = '1249140217663979622';
const canalID = '1249140780493443072';

// PRECIOS
const precios = {
  m4: 20000,
  ak47: 3240,
  mp5: 2400,
  escopeta: 2400,
  deagle: 2400,
  tec9: 2000,
  uzi: 2000
};

// COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catálogo'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total')
    .addStringOption(option => option.setName('arma1').setDescription('Arma 1').setRequired(true))
    .addStringOption(option => option.setName('arma2').setDescription('Arma 2'))
    .addStringOption(option => option.setName('arma3').setDescription('Arma 3'))
    .addStringOption(option => option.setName('arma4').setDescription('Arma 4'))
    .addStringOption(option => option.setName('arma5').setDescription('Arma 5')),

  new SlashCommandBuilder()
    .setName('registro')
    .setDescription('Enviar comprobante')
    .addStringOption(option => option.setName('vendedor').setDescription('Vendedor').setRequired(true))
    .addStringOption(option => option.setName('comprador').setDescription('Comprador').setRequired(true))
    .addStringOption(option => option.setName('arma').setDescription('Arma').setRequired(true))
    .addAttachmentOption(option => option.setName('imagen').setDescription('Captura').setRequired(true))
].map(cmd => cmd.toJSON());

// REGISTRAR
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(rolID)) {
    return interaction.reply({ content: 'No tienes permiso', ephemeral: true });
  }

  // ARMAMENTO
  if (interaction.commandName === 'armamento') {
    const embed = new EmbedBuilder()
      .setTitle('Catálogo de Armamento')
      .setColor(0xffffff)
      .addFields(
        { name: 'M4', value: '$20.000' },
        { name: 'Armas', value: 'AK-47, MP5, Escopeta, Deagle, Tec-9, Uzi' }
      );

    return interaction.reply({ embeds: [embed] });
  }

  // PAGO
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
      `Armas: ${usadas.join(', ')}\nTotal: $${total}`
    );
  }

  // REGISTRO
  if (interaction.commandName === 'registro') {

    await interaction.deferReply({ ephemeral: true });

    try {
      const vendedor = interaction.options.getString('vendedor');
      const comprador = interaction.options.getString('comprador');
      const arma = interaction.options.getString('arma');
      const imagen = interaction.options.getAttachment('imagen');

      console.log('Canal ID:', canalID);

      if (!imagen) {
        return interaction.editReply('Debes subir una imagen.');
      }

      const canal = interaction.guild.channels.cache.get(canalID);

      console.log('Canal encontrado:', canal);

      if (!canal) {
        return interaction.editReply('Canal no encontrado.');
      }

      const embed = new EmbedBuilder()
        .setTitle('📄 Comprobante de Compra')
        .addFields(
          { name: 'Vendedor', value: vendedor },
          { name: 'Comprador', value: comprador },
          { name: 'Arma', value: arma }
        )
        .setImage(imagen.url);

      await canal.send({ embeds: [embed] });

      await interaction.editReply('Comprobante enviado correctamente');

    } catch (error) {
      console.error('ERROR REGISTRO:', error);
      await interaction.editReply('Error: ' + error.message);
    }
  }
});

client.login(TOKEN);
