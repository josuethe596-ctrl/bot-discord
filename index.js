const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1499955518725423244';
const GUILD_ID = '1488371938265923705';
const ROL_ID = '1249140217663979622';
const CANAL_REGISTRO = '1249140780493443072';
const HILO_EXTERNO = '1477760530125947183';

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Catalogo de armas'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total')
    .addStringOption(o => o.setName('arma1').setDescription('Arma 1').setRequired(true))
    .addStringOption(o => o.setName('arma2').setDescription('Arma 2'))
    .addStringOption(o => o.setName('arma3').setDescription('Arma 3'))
    .addStringOption(o => o.setName('arma4').setDescription('Arma 4'))
    .addStringOption(o => o.setName('arma5').setDescription('Arma 5')),

  new SlashCommandBuilder()
    .setName('pack')
    .setDescription('Calcular pack')
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
    ),

  new SlashCommandBuilder()
    .setName('registro')
    .setDescription('Enviar comprobante')
    .addStringOption(o => o.setName('vendedor').setDescription('Vendedor').setRequired(true))
    .addUserOption(o => o.setName('comprador').setDescription('Comprador').setRequired(true))
    .addStringOption(o => o.setName('arma').setDescription('Arma').setRequired(true))
    .addStringOption(o => o.setName('precio').setDescription('Precio').setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setDescription('Imagen').setRequired(true))
].map(c => c.toJSON());

// ===== RESET + REGISTRO =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  try {
    // 🔥 BORRAR TODOS LOS COMANDOS
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );

    console.log('Comandos antiguos eliminados');

    // 🔥 REGISTRAR NUEVOS
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('Comandos nuevos registrados');

  } catch (error) {
    console.error(error);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(ROL_ID)) {
    return interaction.reply({ content: 'No tienes permiso.', ephemeral: true });
  }

  try {

    // ===== REGISTRO =====
    if (interaction.commandName === 'registro') {

      await interaction.deferReply({ ephemeral: true });

      const vendedor = interaction.options.getString('vendedor');
      const comprador = interaction.options.getUser('comprador');
      const arma = interaction.options.getString('arma');
      const precio = interaction.options.getString('precio');
      const imagen = interaction.options.getAttachment('imagen');

      const fecha = new Date().toLocaleDateString();

      // CANAL PRINCIPAL
      const canal = await client.channels.fetch(CANAL_REGISTRO).catch(() => null);

      if (canal) {
        await canal.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('COMPROBANTE DE COMPRA')
              .setColor(0x2b2d31)
              .addFields(
                { name: 'VENDEDOR', value: vendedor },
                { name: 'COMPRADOR', value: comprador.username },
                { name: 'ARMA', value: arma },
                { name: 'TOTAL', value: `$${precio}` }
              )
              .setImage(imagen.url)
          ]
        });
      }

      // HILO EXTERNO (FORMATO DIFERENTE)
      const hilo = await client.channels.fetch(HILO_EXTERNO).catch(() => null);

      if (hilo) {
        await hilo.send({
          content:
`Registro
Dinero recibido: $${precio}
Venta realizada: ${arma}
Vendedor: ${vendedor}
Comprador: ${comprador.username}
Fecha: ${fecha}`,
          files: [imagen.url]
        });
      }

      return interaction.editReply('Registro enviado correctamente.');

    }

  } catch (error) {
    console.error(error);
    return interaction.editReply('Error en el comando.');
  }
});

client.login(TOKEN);
