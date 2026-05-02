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

// ===== DATOS =====
const precios = {
  m4: 20000,
  ak47: 3240,
  mp5: 2400,
  escopeta: 2400,
  deagle: 2400,
  tec9: 2000,
  uzi: 2000
};

const packs = {
  corto: { nombre: 'Corto–Medio', armas: ['Deagle', 'Escopeta'], total: 4500 },
  medio1: { nombre: 'Medio I', armas: ['MP5', 'Escopeta'], total: 4400 },
  medio2: { nombre: 'Medio II', armas: ['Tec-9', 'Escopeta'], total: 4000 },
  medio3: { nombre: 'Medio III', armas: ['Uzi', 'Escopeta'], total: 4000 },
  full1: { nombre: 'Full I', armas: ['M4', 'Deagle', 'MP5', 'Escopeta'], total: 20000 },
  full2: { nombre: 'Full II', armas: ['AK-47', 'Deagle', 'Tec-9', 'Escopeta'], total: 10000 }
};

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
    .addStringOption(o => o.setName('comprador').setDescription('Comprador').setRequired(true))
    .addStringOption(o => o.setName('arma').setDescription('Arma').setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setDescription('Imagen').setRequired(true))
].map(c => c.toJSON());

// ===== REGISTRO =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados');
  } catch (error) {
    console.error('Error registrando comandos:', error);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    // Verificar rol
    if (!interaction.member.roles.cache.has(ROL_ID)) {
      return interaction.reply({ content: 'No tienes permiso.', ephemeral: true });
    }

    // ===== ARMAMENTO =====
    if (interaction.commandName === 'armamento') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('CATALOGO DE ARMAMENTO')
            .setColor(0x2b2d31)
            .addFields(
              { name: 'M4', value: '$20.000' },
              {
                name: 'ARMAS',
                value:
                  'AK-47 — $3.240\nMP5 — $2.400\nEscopeta — $2.400\nDeagle — $2.400\nTec-9 — $2.000\nUzi — $2.000'
              },
              {
                name: 'PACKS',
                value:
                  'Corto–Medio — $4.500\nMedio I — $4.400\nMedio II — $4.000\nMedio III — $4.000\nFull I — $20.000\nFull II — $10.000'
              }
            )
        ]
      });
    }

    // ===== PAGO =====
    if (interaction.commandName === 'pago') {
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
          lista.push(`${arma.toUpperCase()} — $${precios[arma]}`);
        }
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('RESUMEN DE COMPRA')
            .setColor(0x2b2d31)
            .setDescription(lista.join('\n') || 'Sin armas')
            .addFields(
              { name: 'TOTAL', value: `$${total}` },
              {
                name: 'INSTRUCCIONES',
                value: 'Debes donar usando /donar y enviar comprobante.'
              }
            )
        ]
      });
    }

    // ===== PACK =====
    if (interaction.commandName === 'pack') {
      const tipo = interaction.options.getString('tipo');
      const pack = packs[tipo];

      if (!pack) {
        return interaction.reply({ content: 'Pack no válido.', ephemeral: true });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('PACK SELECCIONADO')
            .setColor(0x2b2d31)
            .addFields(
              { name: 'TIPO', value: pack.nombre },
              { name: 'ARMAS', value: pack.armas.join(', ') },
              { name: 'TOTAL', value: `$${pack.total}` }
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
      const imagen = interaction.options.getAttachment('imagen');

      if (!imagen) {
        return interaction.editReply('Debes subir una imagen.');
      }

      const canal = interaction.guild.channels.cache.get(CANAL_REGISTRO);
      if (!canal) {
        return interaction.editReply('Canal no encontrado.');
      }

      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('COMPROBANTE DE COMPRA')
            .setColor(0x2b2d31)
            .addFields(
              { name: 'VENDEDOR', value: vendedor },
              { name: 'COMPRADOR', value: comprador },
              { name: 'ARMA', value: arma }
            )
            .setImage(imagen.url)
        ]
      });

      return interaction.editReply('Comprobante enviado correctamente');
    }

  } catch (error) {
    console.error('ERROR GENERAL:', error);

    if (interaction.deferred) {
      interaction.editReply('Ocurrió un error.');
    } else {
      interaction.reply({ content: 'Error inesperado.', ephemeral: true });
    }
  }
});

// ===== INICIAR =====
client.login(TOKEN);
