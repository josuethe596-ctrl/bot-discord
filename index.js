const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500242491071402144';
const GUILD_ID = '1123790874741047356';

const CANAL_REGISTRO = '1249140780493443072';
const HILO_EXTERNO = '1477760530125947183';

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
  corto: { nombre: 'Pack Corto–Medio Alcance', total: 4500 },
  medio1: { nombre: 'Pack Medio Alcance I', total: 4400 },
  medio2: { nombre: 'Pack Medio Alcance II', total: 4000 },
  medio3: { nombre: 'Pack Medio Alcance III', total: 4000 },
  full1: { nombre: 'Full Pack I', total: 20000 },
  full2: { nombre: 'Full Pack II', total: 10000 }
};

// ===== COMANDOS =====
const commands = [

  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catálogo de armamento'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total de armas')
    .addStringOption(o => o.setName('arma1').setRequired(true))
    .addStringOption(o => o.setName('arma2'))
    .addStringOption(o => o.setName('arma3'))
    .addStringOption(o => o.setName('arma4')),

  new SlashCommandBuilder()
    .setName('pack')
    .setDescription('Seleccionar pack')
    .addStringOption(o =>
      o.setName('tipo')
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
    .addStringOption(o => o.setName('vendedor').setRequired(true))
    .addStringOption(o => o.setName('comprador').setRequired(true))
    .addStringOption(o => o.setName('arma').setRequired(true))
    .addStringOption(o => o.setName('precio').setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setRequired(true))

].map(c => c.toJSON());

// ===== REGISTRAR =====
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

    // ===== ARMAMENTO =====
    if (interaction.commandName === 'armamento') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('Armamento')
            .setDescription(
`M4
Precio: $20.000

Disponible solo para PVT oficiales

Armas disponibles para todo el personal de la United States Marine Corps

AK-47 — $3.240
MP5 — $2.400
Escopeta — $2.400
Desert Eagle — $2.400
Tec-9 — $2.000
Uzi — $2.000

Packs disponibles

Corto–Medio — $4.500
Medio I — $4.400
Medio II — $4.000
Medio III — $4.000
Full I — $20.000
Full II — $10.000`
            )
        ]
      });
    }

    // ===== PAGO =====
    if (interaction.commandName === 'pago') {

      let total = 0;

      const armas = [
        interaction.options.getString('arma1'),
        interaction.options.getString('arma2'),
        interaction.options.getString('arma3'),
        interaction.options.getString('arma4')
      ];

      for (let arma of armas) {
        if (!arma) continue;
        arma = arma.toLowerCase();
        if (precios[arma]) total += precios[arma];
      }

      return interaction.reply({
        content:
`Total a pagar: $${total}

Debes pagar en la caja fuerte /donar y pasar comprobante`
      });
    }

    // ===== PACK =====
    if (interaction.commandName === 'pack') {

      const tipo = interaction.options.getString('tipo');
      const pack = packs[tipo];

      return interaction.reply({
        content:
`${pack.nombre}
Total: $${pack.total}

Debes pagar en la caja fuerte /donar y pasar comprobante`
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

      const fecha = new Date().toLocaleDateString();

      const mensaje =
`Registro
Dinero recibido: $${precio}
Venta realizada: ${arma}
Vendedor: ${vendedor}
Comprador: ${comprador}
Fecha: ${fecha}`;

      // CANAL 1
      const canal = await client.channels.fetch(CANAL_REGISTRO).catch(() => null);
      if (canal) {
        await canal.send({
          content: mensaje,
          files: [imagen.url]
        });
      }

      // HILO DISCORD 2
      const hilo = await client.channels.fetch(HILO_EXTERNO).catch(() => null);
      if (hilo) {
        await hilo.send({
          content: mensaje,
          files: [imagen.url]
        });
      }

      return interaction.editReply('Registro enviado correctamente.');
    }

  } catch (error) {
    console.error(error);
    return interaction.reply({ content: 'Error en el comando.', ephemeral: true });
  }
});

client.login(TOKEN);
