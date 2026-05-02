const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500242491071402144';
const GUILD_ID = '1123790874741047356';
const CANAL_REGISTRO = '1249140780493443072';

const COLOR = 0xff0000;

// ===== PRECIOS =====
const precios = {
  m4: 20000,
  ak47: 3240,
  mp5: 2400,
  escopeta: 2400,
  deagle: 2400,
  tec9: 2000,
  uzi: 2000
};

// ===== PACKS =====
const packs = {
  corto: { nombre: 'Pack Corto–Medio Alcance', armas: ['Desert Eagle', 'Escopeta'], total: 4500 },
  medio1: { nombre: 'Pack Medio Alcance I', armas: ['MP5', 'Escopeta'], total: 4400 },
  medio2: { nombre: 'Pack Medio Alcance II', armas: ['Tec-9', 'Escopeta'], total: 4000 },
  medio3: { nombre: 'Pack Medio Alcance III', armas: ['Uzi', 'Escopeta'], total: 4000 },
  full1: { nombre: 'Full Pack I', armas: ['M4', 'Desert Eagle', 'MP5', 'Escopeta'], total: 20000 },
  full2: { nombre: 'Full Pack II', armas: ['AK-47', 'Desert Eagle', 'Tec-9', 'Escopeta'], total: 10000 }
};

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder().setName('armamento').setDescription('Ver catálogo'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total')
    .addStringOption(o => o.setName('arma1').setDescription('Arma 1').setRequired(true))
    .addStringOption(o => o.setName('arma2').setDescription('Arma 2'))
    .addStringOption(o => o.setName('arma3').setDescription('Arma 3'))
    .addStringOption(o => o.setName('arma4').setDescription('Arma 4')),

  new SlashCommandBuilder()
    .setName('pack')
    .setDescription('Seleccionar pack')
    .addStringOption(o =>
      o.setName('tipo')
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
    .setDescription('Registrar venta')
    .addStringOption(o => o.setName('vendedor').setDescription('Vendedor').setRequired(true))
    .addStringOption(o => o.setName('comprador').setDescription('Comprador').setRequired(true))
    .addStringOption(o => o.setName('arma').setDescription('Arma').setRequired(true))
    .addStringOption(o => o.setName('precio').setDescription('Precio').setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setDescription('Comprobante').setRequired(true))

].map(c => c.toJSON());

// ===== REGISTRO =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log('Bot listo');

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {

    // ===== ARMAMENTO (RESUMEN PRO) =====
    if (interaction.commandName === 'armamento') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle('Catálogo de Armamento')
            .setDescription(`Se comunica a todo el personal del **United States Marine Corps** el armamento disponible.

**M4**
Disponible desde rango PVT oficial
Precio: $20.000

--------

Armas generales

AK-47 — $3.240
MP5 — $2.400
Escopeta — $2.400
Desert Eagle — $2.400
Tec-9 — $2.000
Uzi — $2.000

--------

Packs disponibles

Corto–Medio — $4.500
Medio I — $4.400
Medio II — $4.000
Medio III — $4.000
Full I — $20.000
Full II — $10.000

Usa /pago o /pack para calcular compras.`)
        ]
      });
    }

    // ===== PAGO =====
    if (interaction.commandName === 'pago') {
      let total = 0;
      let lista = [];

      const armas = [
        interaction.options.getString('arma1'),
        interaction.options.getString('arma2'),
        interaction.options.getString('arma3'),
        interaction.options.getString('arma4')
      ];

      for (let arma of armas) {
        if (!arma) continue;
        arma = arma.toLowerCase();

        if (precios[arma]) {
          total += precios[arma];
          lista.push(`${arma.toUpperCase()} — $${precios[arma]}`);
        }
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle('Resumen de Compra')
            .setDescription(lista.join('\n') || 'Sin armas')
            .addFields(
              { name: 'Total', value: `$${total}` },
              { name: 'Pago', value: 'Debes pagar en la caja fuerte /donar y pasar comprobante' }
            )
        ]
      });
    }

    // ===== PACK =====
    if (interaction.commandName === 'pack') {
      const tipo = interaction.options.getString('tipo');
      const pack = packs[tipo];

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(pack.nombre)
            .setDescription(pack.armas.join('\n'))
            .addFields(
              { name: 'Total', value: `$${pack.total}` },
              { name: 'Pago', value: 'Debes pagar en la caja fuerte /donar y pasar comprobante' }
            )
        ]
      });
    }

    // ===== REGISTRO =====
    if (interaction.commandName === 'registro') {

      await interaction.deferReply({ ephemeral: true });

      const vendedor = interaction.options.getString('vendedor');
      const comprador = interaction.options.getString('comprador');
      const arma = interaction.options.getString('arma');
      const precio = interaction.options.getString('precio');
      const imagen = interaction.options.getAttachment('imagen');

      if (!imagen?.url) {
        return interaction.editReply('Debes subir una imagen válida.');
      }

      const mensaje =
`Registro
Dinero recibido: $${precio}
Venta realizada: ${arma}
Vendedor: ${vendedor}
Comprador: ${comprador}`;

      await interaction.editReply('Registro enviado correctamente.');

      client.channels.fetch(CANAL_REGISTRO)
        .then(canal => {
          if (canal && canal.type === ChannelType.GuildText) {
            canal.send({
              content: mensaje,
              files: [{ attachment: imagen.url }]
            });
          }
        })
        .catch(() => {});
    }

  } catch (error) {
    console.error(error);
    interaction.reply({ content: 'Error.', ephemeral: true });
  }
});

client.login(TOKEN);
