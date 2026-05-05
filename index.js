const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: [] }
});

// ==================== CONFIGURACION ====================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500242491071402144';
const GUILD_ID = '1123790874741047356';

// Canales de registro
const CANAL_REGISTRO_LOCAL = '1249140780493443072';
const CANAL_REGISTRO_EXTERNO = '1477760530125947183';
const CANAL_UNIDADES = '1477758449390719189';

// Roles autorizados
const ROL_SUELDO = '1249089172308885576';
const ROL_UNIDADES = '1486140887430992004';

// ==================== BASE DE DATOS ====================
const CATALOGO_ARMAS = {
  m4: { 
    nombre: 'M4', 
    precio: 20000, 
    categoria: 'Rifle de Asalto',
    requisito: 'Rango PVT oficial',
    descripcion: 'Rifle estandar del USMC, alta precision y cadencia'
  },
  ak47: { 
    nombre: 'AK-47', 
    precio: 3240, 
    categoria: 'Rifle de Asalto',
    requisito: 'Sin restricciones',
    descripcion: 'Rifle sovietico, confiable en cualquier condicion'
  },
  mp5: { 
    nombre: 'MP5', 
    precio: 2400, 
    categoria: 'Subfusil',
    requisito: 'Sin restricciones',
    descripcion: 'Subfusil compacto, ideal para operaciones CQB'
  },
  escopeta: { 
    nombre: 'Escopeta', 
    precio: 2400, 
    categoria: 'Escopeta',
    requisito: 'Sin restricciones',
    descripcion: 'Potencia de fuego devastadora a corta distancia'
  },
  deagle: { 
    nombre: 'Desert Eagle', 
    precio: 2400, 
    categoria: 'Pistola',
    requisito: 'Sin restricciones',
    descripcion: 'Pistola de alto calibre, peso considerable',
    alias: ['dk', 'deagle', 'deserteagle']
  },
  tec9: { 
    nombre: 'Tec-9', 
    precio: 2000, 
    categoria: 'Pistola Automatica',
    requisito: 'Sin restricciones',
    descripcion: 'Pistola automatica, alta cadencia de fuego'
  },
  uzi: { 
    nombre: 'Uzi', 
    precio: 2000, 
    categoria: 'Subfusil',
    requisito: 'Sin restricciones',
    descripcion: 'Subfusil israeli, compacto y letal'
  }
};

const CATALOGO_PACKS = {
  corto: { 
    nombre: 'Pack Corto-Medio Alcance', 
    armas: ['Desert Eagle', 'Escopeta'], 
    total: 4500,
    ahorro: 300
  },
  medio1: { 
    nombre: 'Pack Medio Alcance I', 
    armas: ['MP5', 'Escopeta'], 
    total: 4400,
    ahorro: 400
  },
  medio2: { 
    nombre: 'Pack Medio Alcance II', 
    armas: ['Tec-9', 'Escopeta'], 
    total: 4000,
    ahorro: 400
  },
  medio3: { 
    nombre: 'Pack Medio Alcance III', 
    armas: ['Uzi', 'Escopeta'], 
    total: 4000,
    ahorro: 400
  },
  full1: { 
    nombre: 'Full Pack I', 
    armas: ['M4', 'Desert Eagle', 'MP5', 'Escopeta'], 
    total: 20000,
    ahorro: 6800
  },
  full2: { 
    nombre: 'Full Pack II', 
    armas: ['AK-47', 'Desert Eagle', 'Tec-9', 'Escopeta'], 
    total: 10000,
    ahorro: 1640
  }
};

// ==================== TABLA DE SUELDOS ====================
const TABLA_SUELDOS = {
  'Commissioned Officers': [
    { rol: '<@&1249070554330169456>', sueldo: 80000 },
    { rol: '<@&1249071682476314716>', sueldo: 80000 },
    { rol: '<@&1249072078435385354>', sueldo: 80000 },
    { rol: '<@&1249072776480952430>', sueldo: 80000 },
    { rol: '<@&1249073570932330647>', sueldo: 80000 }
  ],
  'Warrant Officers': [
    { rol: '<@&1465109878744940667>', sueldo: 75000 },
    { rol: '<@&1249074305438978150>', sueldo: 75000 }
  ],
  'Staff Non - Commissioned Officers': [
    { rol: '<@&1465108847633895456>', sueldo: 70000 },
    { rol: '<@&1249075344410153061>', sueldo: 70000 },
    { rol: '<@&1249076492147626044>', sueldo: 65000 }
  ],
  'Non - Commissioned Officers': [
    { rol: '<@&1249076802312212500>', sueldo: 65000 },
    { rol: '<@&1249077129384165450>', sueldo: 60000 }
  ],
  'Junior Enlisted': [
    { rol: '<@&1249078185077772409>', sueldo: 55000 },
    { rol: '<@&1249078391530061855>', sueldo: 50000 },
    { rol: '<@&1249078539135877169>', sueldo: 45000 }
  ]
};

// ==================== REGISTROS DE UNIDADES (EN MEMORIA) ====================
const registrosUnidades = {};

// ==================== UTILIDADES ====================
function formatearPrecio(cantidad) {
  return `$${cantidad.toLocaleString('en-US')}`;
}

function buscarArma(entrada) {
  if (!entrada) return null;
  const clave = entrada.toLowerCase().replace(/[-\s]/g, '');

  if (CATALOGO_ARMAS[clave]) return CATALOGO_ARMAS[clave];

  for (const [key, arma] of Object.entries(CATALOGO_ARMAS)) {
    if (arma.alias && arma.alias.includes(clave)) {
      return arma;
    }
    const nombreLimpio = arma.nombre.toLowerCase().replace(/[-\s]/g, '');
    if (nombreLimpio === clave || nombreLimpio.includes(clave)) {
      return arma;
    }
  }

  return null;
}

function obtenerClaveMes(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function obtenerNombreMes(claveMes) {
  const [anio, mes] = claveMes.split('-');
  const fecha = new Date(parseInt(anio), parseInt(mes) - 1, 1);
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function verificarRol(interaction, rolId) {
  return interaction.member.roles.cache.has(rolId);
}

// ==================== COMANDOS ====================
const commands = [
  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catalogo completo de armamento'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total de compra individual')
    .addStringOption(o => 
      o.setName('arma1')
        .setDescription('Primera arma (escribe dk para Desert Eagle)')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('arma2')
        .setDescription('Segunda arma (opcional)')
        .setRequired(false)
    )
    .addStringOption(o => 
      o.setName('arma3')
        .setDescription('Tercera arma (opcional)')
        .setRequired(false)
    )
    .addStringOption(o => 
      o.setName('arma4')
        .setDescription('Cuarta arma (opcional)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('pack')
    .setDescription('Seleccionar pack de armamento')
    .addStringOption(o =>
      o.setName('tipo')
        .setDescription('Tipo de pack disponible')
        .setRequired(true)
        .addChoices(
          { name: 'Corto-Medio Alcance | $4,500', value: 'corto' },
          { name: 'Medio Alcance I | $4,400', value: 'medio1' },
          { name: 'Medio Alcance II | $4,000', value: 'medio2' },
          { name: 'Medio Alcance III | $4,000', value: 'medio3' },
          { name: 'Full Pack I | $20,000', value: 'full1' },
          { name: 'Full Pack II | $10,000', value: 'full2' }
        )
    ),

  new SlashCommandBuilder()
    .setName('registro')
    .setDescription('Registrar venta de armamento')
    .addStringOption(o => 
      o.setName('vendedor')
        .setDescription('Nombre del vendedor')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('comprador')
        .setDescription('Nombre del comprador')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('arma')
        .setDescription('Arma o pack vendido')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('precio')
        .setDescription('Monto total de la venta')
        .setRequired(true)
    )
    .addAttachmentOption(o => 
      o.setName('comprobante')
        .setDescription('Captura de pantalla del pago')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('sueldo')
    .setDescription('Ver tabla de sueldos USMC (solo autorizados)'),

  new SlashCommandBuilder()
    .setName('unidadesp')
    .setDescription('Registrar mantenimiento de unidad (solo autorizados)')
    .addStringOption(o =>
      o.setName('vehiculo')
        .setDescription('Nombre del vehiculo (ej: LV-PD)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('id')
        .setDescription('ID del vehiculo (ej: NG-24602)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('monto')
        .setDescription('Monto sacado para mantenimiento (ej: 40000)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('dia')
        .setDescription('Dia de mantenimiento (ej: Lunes 13 de Abril)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('fecha')
        .setDescription('Fecha (DD/MM/AA) (ej: 13/04/26)')
        .setRequired(true)
    )
    .addAttachmentOption(o =>
      o.setName('captura')
        .setDescription('Screenshot / Captura del mantenimiento')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('umes')
    .setDescription('Ver resumen mensual de mantenimientos (solo autorizados)')

].map(c => c.toJSON());

// ==================== REGISTRO DE COMANDOS ====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log(`[READY] Bot conectado como ${client.user.tag}`);
  console.log(`[INFO] Servidores conectados: ${client.guilds.cache.size}`);
  client.guilds.cache.forEach(guild => {
    console.log(`  - ${guild.name} (${guild.id})`);
  });

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('[SUCCESS] Comandos slash registrados');
  } catch (error) {
    console.error('[ERROR] Fallo al registrar comandos:', error);
  }
});

// ==================== INTERACCIONES ====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {

      case 'armamento': {
        let descripcionArmas = '';
        let descripcionPacks = '';

        const categorias = {};
        Object.values(CATALOGO_ARMAS).forEach(arma => {
          if (!categorias[arma.categoria]) categorias[arma.categoria] = [];
          categorias[arma.categoria].push(
            `**${arma.nombre}** — ${formatearPrecio(arma.precio)}\n` +
            `${arma.descripcion}\n` +
            `Requisito: ${arma.requisito}\n`
          );
        });

        Object.entries(categorias).forEach(([cat, armas]) => {
          descripcionArmas += `\n[ ${cat.toUpperCase()} ]\n${armas.join('\n')}`;
        });

        Object.values(CATALOGO_PACKS).forEach(pack => {
          descripcionPacks += 
            `\n${pack.nombre} — ${formatearPrecio(pack.total)}\n` +
            `Armas: ${pack.armas.join(', ')}\n` +
            `Ahorro: ${formatearPrecio(pack.ahorro)}\n`;
        });

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('Catalogo de Armamento USMC')
          .setDescription(
            `Sistema de suministro del **United States Marine Corps**\n\n` +
            `--- ARMAS INDIVIDUALES ---${descripcionArmas}\n\n` +
            `--- PACKS ESPECIALES ---${descripcionPacks}`
          )
          .setTimestamp()
          .setFooter({ 
            text: 'USMC Sistema de Armamento | United States Marine Corps' 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'pago': {
        const armasInput = [
          interaction.options.getString('arma1'),
          interaction.options.getString('arma2'),
          interaction.options.getString('arma3'),
          interaction.options.getString('arma4')
        ].filter(Boolean);

        let total = 0;
        let itemsValidos = [];
        let itemsInvalidos = [];

        armasInput.forEach(entrada => {
          const arma = buscarArma(entrada);
          if (arma) {
            total += arma.precio;
            itemsValidos.push(`[OK] ${arma.nombre} — ${formatearPrecio(arma.precio)}`);
          } else {
            itemsInvalidos.push(`[X] "${entrada}" — No encontrada`);
          }
        });

        if (itemsValidos.length === 0) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Error de Seleccion')
                .setDescription(
                  `Ninguna arma valida encontrada.\n\n` +
                  `Intentaste buscar:\n${itemsInvalidos.join('\n')}\n\n` +
                  `Usa /armamento para ver el catalogo completo.`
                )
            ],
            ephemeral: true
          });
        }

        let descripcion = `**Articulos Seleccionados**\n${itemsValidos.join('\n')}`;
        if (itemsInvalidos.length > 0) {
          descripcion += `\n\n**Articulos No Encontrados**\n${itemsInvalidos.join('\n')}`;
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('Resumen de la Compra')
          .setDescription(descripcion)
          .addFields(
            { name: 'TOTAL A PAGAR', value: `**${formatearPrecio(total)}**` },
            { name: 'INSTRUCCIONES', value: 
              'Realiza el pago en la caja fuerte usando /donar,\n' +
              'Toma captura del comprobante, y mandarlo por aqui' 
            }
          )
          .setTimestamp()
          .setFooter({ 
            text: 'USMC Sistema de Armamento | United States Marine Corps' 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'pack': {
        const tipo = interaction.options.getString('tipo');
        const pack = CATALOGO_PACKS[tipo];

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle(pack.nombre.toUpperCase())
          .setDescription(
            `**CONTENIDO DEL PACK**\n` +
            `${pack.armas.join('\n')}\n\n` +
            `**AHORRO:** ${formatearPrecio(pack.ahorro)}`
          )
          .addFields(
            { name: 'PRECIO TOTAL', value: `**${formatearPrecio(pack.total)}**`, inline: true },
            { name: 'CANTIDAD', value: `${pack.armas.length} armas`, inline: true },
            { name: 'INSTRUCCIONES', value: 
              'Realiza el pago en la caja fuerte /donar,\n' +
              'Guarda el comprobante,' 
            }
          )
          .setTimestamp()
          .setFooter({ 
            text: 'USMC Sistema de Armamento | United States Marine Corps' 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'sueldo': {
        if (!verificarRol(interaction, ROL_SUELDO)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Acceso Denegado')
                .setDescription('No tienes permiso para usar este comando.')
            ],
            ephemeral: true
          });
        }

        let descripcion = '**Salario base.**\n\n';

        for (const [categoria, roles] of Object.entries(TABLA_SUELDOS)) {
          descripcion += `# ${categoria}\n\n`;
          roles.forEach(item => {
            descripcion += `${item.rol} ${formatearPrecio(item.sueldo)}\n`;
          });
          descripcion += '\n';
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('Tabla de Sueldos USMC')
          .setDescription(descripcion)
          .setTimestamp()
          .setFooter({ 
            text: 'USMC Sistema de Armamento | United States Marine Corps' 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'unidadesp': {
        if (!verificarRol(interaction, ROL_UNIDADES)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Acceso Denegado')
                .setDescription('No tienes permiso para usar este comando.')
            ],
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });

        const vehiculo = interaction.options.getString('vehiculo');
        const idVehiculo = interaction.options.getString('id');
        const montoRaw = interaction.options.getString('monto');
        const dia = interaction.options.getString('dia');
        const fecha = interaction.options.getString('fecha');
        const captura = interaction.options.getAttachment('captura');

        const montoLimpio = montoRaw.replace(/[$,\s]/g, '');
        const monto = parseInt(montoLimpio);

        if (isNaN(monto) || monto <= 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Error')
                .setDescription(`El monto "${montoRaw}" no es valido. Usa solo numeros.`)
            ]
          });
        }

        if (!captura?.url) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Error')
                .setDescription('Debes adjuntar una captura valida.')
            ]
          });
        }

        const ahora = new Date();
        const claveMes = obtenerClaveMes(ahora);

        if (!registrosUnidades[claveMes]) {
          registrosUnidades[claveMes] = [];
        }

        registrosUnidades[claveMes].push({
          monto: monto,
          vehiculo: vehiculo,
          id: idVehiculo,
          dia: dia,
          fecha: fecha,
          usuario: interaction.user.tag,
          timestamp: ahora.toISOString()
        });

        const embedUnidad = new EmbedBuilder()
          .setColor(0x8B0000)
          .setDescription(
            `__**FORMATO DE MANTENIMIENTO**__\n\n` +
            `- **Nombre del Vehiculo**: \`${vehiculo}\`\n` +
            `- **ID Del Vehiculo** : \`[${idVehiculo}]\`\n` +
            `- **Monto Sacado** : \`${formatearPrecio(monto)}\`\n` +
            `- **Dia de Mantenimiento** : \`${dia}\`\n` +
            `- **Fecha** : \`${fecha}\`\n` +
            `- **SS/Captura** :`
          )
          .setImage(captura.url)
          .setTimestamp()
          .setFooter({ 
            text: `Registrado por ${interaction.user.tag}` 
          });

        let enviado = false;

        try {
          const canalUnidades = await client.channels.fetch(CANAL_UNIDADES);
          console.log(`[UNIDADES] Canal: ${canalUnidades.name} | Tipo: ${canalUnidades.type}`);

          const esCanalValido = [
            ChannelType.GuildText,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread,
            ChannelType.GuildForum
          ].includes(canalUnidades.type);

          if (esCanalValido) {
            await canalUnidades.send({ embeds: [embedUnidad] });
            console.log('[UNIDADES] Enviado correctamente');
            enviado = true;
          } else {
            throw new Error(`Tipo no soportado: ${canalUnidades.type}`);
          }
        } catch (err) {
          console.error('[UNIDADES] Error:', err.message);
        }

        const embedRespuesta = new EmbedBuilder()
          .setColor(enviado ? 0x006400 : 0xB8860B)
          .setTitle(enviado ? 'Registro Guardado' : 'Registro Guardado (Local)')
          .setDescription(
            `**Mantenimiento registrado**\n\n` +
            `Vehiculo: ${vehiculo}\n` +
            `Monto: ${formatearPrecio(monto)}\n` +
            `Mes: ${obtenerNombreMes(claveMes)}\n\n` +
            `${enviado ? 'Enviado al hilo de foro correctamente.' : 'Guardado localmente. No se pudo enviar al hilo de foro.'}`
          );

        if (!enviado) {
          embedRespuesta.addFields({
            name: 'Nota',
            value: 'Verifica que el bot tenga acceso al hilo y permisos de enviar mensajes.'
          });
        }

        await interaction.editReply({ embeds: [embedRespuesta] });
        break;
      }

      case 'umes': {
        if (!verificarRol(interaction, ROL_UNIDADES)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Acceso Denegado')
                .setDescription('No tienes permiso para usar este comando.')
            ],
            ephemeral: true
          });
        }

        const ahora = new Date();
        const claveMesActual = obtenerClaveMes(ahora);
        const nombreMesActual = obtenerNombreMes(claveMesActual);

        const registrosMes = registrosUnidades[claveMesActual] || [];
        const totalMes = registrosMes.reduce((suma, reg) => suma + reg.monto, 0);

        const mesesDisponibles = Object.keys(registrosUnidades).sort().reverse();

        let descripcion = `**Resumen del mes: ${nombreMesActual}**\n\n`;

        if (registrosMes.length === 0) {
          descripcion += `No hay registros de mantenimiento este mes.\n`;
        } else {
          descripcion += `**Total de mantenimientos:** ${registrosMes.length}\n`;
          descripcion += `**Dinero total recolectado:** ${formatearPrecio(totalMes)}\n\n`;

          descripcion += `**Detalle de registros:**\n`;
          registrosMes.forEach((reg, index) => {
            descripcion += `${index + 1}. ${reg.vehiculo} [${reg.id}] — ${formatearPrecio(reg.monto)}\n`;
          });
        }

        if (mesesDisponibles.length > 1) {
          descripcion += `\n**Historial mensual:**\n`;
          mesesDisponibles.forEach(mes => {
            if (mes === claveMesActual) return;
            const total = registrosUnidades[mes].reduce((s, r) => s + r.monto, 0);
            const cantidad = registrosUnidades[mes].length;
            descripcion += `${obtenerNombreMes(mes)}: ${formatearPrecio(total)} (${cantidad} registros)\n`;
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('RESUMEN MENSUAL DE MANTENIMIENTOS')
          .setDescription(descripcion)
          .setTimestamp()
          .setFooter({ 
            text: `Solicitado por ${interaction.user.tag} | USMC Unidades` 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'registro': {
        await interaction.deferReply({ ephemeral: true });

        const vendedor = interaction.options.getString('vendedor');
        const comprador = interaction.options.getString('comprador');
        const arma = interaction.options.getString('arma');
        const precioRaw = interaction.options.getString('precio');
        const comprobante = interaction.options.getAttachment('comprobante');

        if (!comprobante?.url) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Error')
                .setDescription('Debes adjuntar una imagen valida del comprobante.')
            ]
          });
        }

        const precioLimpio = precioRaw.replace(/[$,\s]/g, '');
        const precio = parseInt(precioLimpio);

        if (isNaN(precio) || precio <= 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('Error')
                .setDescription(`El precio "${precioRaw}" no es valido.`)
            ]
          });
        }

        const ahora = new Date();
        const fechaFormateada = ahora.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const horaFormateada = ahora.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const embedRegistro = new EmbedBuilder()
          .setColor(0x8B0000)
          .setDescription(
            `Dinero recibido: ${formatearPrecio(precio)}\n` +
            `Venta realizada: ${arma}\n` +
            `Vendedor: ${vendedor}\n` +
            `Comprador: ${comprador}\n` +
            `Fecha: ${fechaFormateada} ${horaFormateada}`
          )
          .setImage(comprobante.url);

        let exitos = 0;
        let fallos = 0;
        const errores = [];

        try {
          const canalLocal = await client.channels.fetch(CANAL_REGISTRO_LOCAL);
          if (canalLocal && (canalLocal.type === ChannelType.GuildText || canalLocal.type === ChannelType.PublicThread || canalLocal.type === ChannelType.PrivateThread)) {
            await canalLocal.send({ embeds: [embedRegistro] });
            exitos++;
          }
        } catch (err) {
          fallos++;
          errores.push(`Canal local: ${err.message}`);
        }

        try {
          const canalExterno = await client.channels.fetch(CANAL_REGISTRO_EXTERNO);
          const esCanalValido = [
            ChannelType.GuildText,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread
          ].includes(canalExterno.type);

          if (esCanalValido) {
            await canalExterno.send({ embeds: [embedRegistro] });
            exitos++;
          }
        } catch (err) {
          fallos++;
          errores.push(`Canal externo: ${err.message}`);
        }

        let titulo, color, mensaje;
        if (exitos === 2) {
          titulo = 'Registro Exitoso';
          color = 0x006400;
          mensaje = 'Se envio correctamente a ambos canales.';
        } else if (exitos === 1) {
          titulo = 'Registro Parcial';
          color = 0xB8860B;
          mensaje = 'Se envio a 1 de 2 canales.';
        } else {
          titulo = 'Fallo Total';
          color = 0x8B0000;
          mensaje = 'No se pudo enviar a ningun canal.';
        }

        const embedRespuesta = new EmbedBuilder()
          .setColor(color)
          .setTitle(titulo)
          .setDescription(mensaje);

        if (fallos > 0) {
          embedRespuesta.addFields({ 
            name: 'Errores', 
            value: errores.join('\n') 
          });
        }

        await interaction.editReply({ embeds: [embedRespuesta] });
        break;
      }

      default:
        break;
    }

  } catch (error) {
    console.error(`[ERROR] Comando ${interaction.commandName}:`, error);

    const mensajeError = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle('Error del Sistema')
      .setDescription('Ocurrio un error interno. Contacta a un administrador.');

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [mensajeError] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [mensajeError], ephemeral: true }).catch(() => {});
    }
  }
});

client.on('error', error => console.error('[CLIENT ERROR]', error));
client.on('warn', warn => console.warn('[CLIENT WARN]', warn));

process.on('unhandledRejection', error => console.error('[UNHANDLED REJECTION]', error));
process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

client.login(TOKEN).catch(err => {
  console.error('[FATAL] No se pudo iniciar sesion:', err);
  process.exit(1);
});
