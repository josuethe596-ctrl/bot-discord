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

// Canales
const CANAL_REGISTRO_LOCAL = '1249140780493443072';
const CANAL_REGISTRO_EXTERNO = '1477760530125947183';
const CANAL_UNIDADES = '1477758449390719189';
const CANAL_ANUNCIOS = '1499835071245586544';

// Roles autorizados
const ROL_SUELDO = '1249089172308885576';
const ROL_UNIDADES = '1486140887430992004';
const ROL_PACAS = '1365194603380342895';
const ROL_ANUNCIOS = '1249089172308885576';

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

// ==================== REGISTROS EN MEMORIA ====================
const registrosUnidades = {};
const registrosPacas = {};
const registrosArmamento = {};

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

function verificarRolesMultiples(interaction, rolesIds) {
  return rolesIds.some(rolId => interaction.member.roles.cache.has(rolId));
}

// ==================== UTILIDADES DE TIEMPO PARA ANUNCIOS ====================

function formatearFechaMilitar(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function formatearHoraMilitar(fecha) {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function parsearFechaHora(fechaStr, horaStr) {
  // fechaStr: DD/MM/YYYY o DD/MM/YY
  // horaStr: HH:MM (24h)
  const partesFecha = fechaStr.split(/[\/\-]/);
  let dia = parseInt(partesFecha[0]);
  let mes = parseInt(partesFecha[1]) - 1;
  let anio = parseInt(partesFecha[2]);
  
  if (anio < 100) anio += 2000;
  
  const partesHora = horaStr.split(':');
  const horas = parseInt(partesHora[0]);
  const minutos = parseInt(partesHora[1]) || 0;
  
  return new Date(anio, mes, dia, horas, minutos, 0);
}

function calcularTiempoRestante(fechaObjetivo) {
  const ahora = new Date();
  const diffMs = fechaObjetivo.getTime() - ahora.getTime();
  
  if (diffMs <= 0) return 'El evento ya ha comenzado';
  
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);
  
  if (diffMin < 1) return 'En menos de 1 minuto';
  if (diffMin < 60) return `En ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  if (diffHoras < 24) return `En ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
  if (diffDias === 1) return 'Manana';
  if (diffDias === 2) return 'Pasado manana';
  return `En ${diffDias} dias`;
}

function formatearTimestampDiscord(fecha) {
  return `<t:${Math.floor(fecha.getTime() / 1000)}:F>`;
}

function formatearTimestampRelativo(fecha) {
  return `<t:${Math.floor(fecha.getTime() / 1000)}:R>`;
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
    .setDescription('Registrar venta de armamento y enviar a hilos')
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
    .setName('armes')
    .setDescription('Ver resumen mensual de ventas de armamento (solo autorizados)'),

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
    .setDescription('Ver resumen mensual de mantenimientos (solo autorizados)'),

  new SlashCommandBuilder()
    .setName('pacade')
    .setDescription('Registrar dinero recolectado de pacas (solo autorizados)')
    .addStringOption(o =>
      o.setName('periodo_inicio')
        .setDescription('Fecha inicio del periodo (DD/MM/AA) (ej: 01/02/26)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('periodo_fin')
        .setDescription('Fecha fin del periodo (DD/MM/AA) (ej: 01/03/26)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('monto')
        .setDescription('Monto recolectado en el periodo (ej: 360000)')
        .setRequired(true)
    )
    .addAttachmentOption(o =>
      o.setName('captura')
        .setDescription('Screenshot / Comprobante del dinero recolectado')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('pmes')
    .setDescription('Ver resumen mensual de dinero recolectado de pacas (solo autorizados)'),

  // ==================== ANUNCIOS MEJORADO ====================
  new SlashCommandBuilder()
    .setName('anuncios')
    .setDescription('Crear y enviar un comunicado oficial USMC (solo autorizados)')
    .addStringOption(o =>
      o.setName('titulo')
        .setDescription('Titulo del comunicado')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('contenido')
        .setDescription('Contenido del comunicado')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('tipo')
        .setDescription('Tipo de comunicado')
        .setRequired(true)
        .addChoices(
          { name: 'Reunion Leadership', value: 'reunion_leadership' },
          { name: 'Comunicado Oficial', value: 'comunicado' },
          { name: 'Alerta / Aviso', value: 'alerta' },
          { name: 'Entrenamiento', value: 'entrenamiento' },
          { name: 'Promocion', value: 'promocion' },
          { name: 'Evento Especial', value: 'evento' }
        )
    )
    .addStringOption(o =>
      o.setName('fecha_evento')
        .setDescription('Fecha del evento (DD/MM/YYYY)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('hora_evento')
        .setDescription('Hora base del evento (HH:MM formato 24h)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('zona_horaria')
        .setDescription('Zona horaria base (ej: Argentina, Venezuela)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('horarios')
        .setDescription('Horarios adicionales: Pais:HH:MM, Pais:HH:MM (ej: Colombia:16:00, Mexico:15:00)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('obligatorio')
        .setDescription('La asistencia es obligatoria?')
        .setRequired(false)
        .addChoices(
          { name: 'Si - Asistencia obligatoria', value: 'si' },
          { name: 'No - Asistencia opcional', value: 'no' }
        )
    )
    .addStringOption(o =>
      o.setName('firma')
        .setDescription('Firma y cargo (ej: WO-1 | Zayas)')
        .setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName('imagen')
        .setDescription('Imagen del comunicado (opcional)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('mencion')
        .setDescription('Mencion: @everyone, @here, o ID de rol')
        .setRequired(false)
    )

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

        const precioLimpio = precioRaw.replace(/[$,.\s]/g, '');
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
        const claveMes = obtenerClaveMes(ahora);
        
        if (!registrosArmamento[claveMes]) {
          registrosArmamento[claveMes] = [];
        }
        
        registrosArmamento[claveMes].push({
          vendedor,
          comprador,
          arma,
          precio,
          usuario: interaction.user.tag,
          timestamp: ahora.toISOString()
        });

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
          .setTitle('Venta de Armamento Registrada')
          .setDescription(
            `**Dinero recibido:** ${formatearPrecio(precio)}\n` +
            `**Venta realizada:** ${arma}\n` +
            `**Vendedor:** ${vendedor}\n` +
            `**Comprador:** ${comprador}\n` +
            `**Fecha:** ${fechaFormateada} ${horaFormateada}\n` +
            `**Registrado por:** ${interaction.user.tag}`
          )
          .setImage(comprobante.url)
          .setTimestamp()
          .setFooter({ 
            text: 'USMC Sistema de Armamento | Registro Oficial' 
          });

        let exitos = 0;
        let fallos = 0;
        const errores = [];
        const hilosCreados = [];

        async function enviarAHilo(channelId, embed, nombreHilo) {
          try {
            const canal = await client.channels.fetch(channelId);
            
            if (canal.type === ChannelType.GuildText || canal.type === ChannelType.GuildAnnouncement) {
              const nombreThread = `${nombreHilo} — ${obtenerNombreMes(claveMes)}`;
              
              const threads = canal.threads.cache;
              let thread = threads.find(t => t.name === nombreThread);
              
              if (!thread) {
                thread = await canal.threads.create({
                  name: nombreThread,
                  autoArchiveDuration: 10080,
                  reason: `Registro automatico de ${nombreHilo}`
                });
                hilosCreados.push(nombreThread);
              }
              
              await thread.send({ embeds: [embed] });
              return { success: true, thread: true };
            } 
            else if ([ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(canal.type)) {
              await canal.send({ embeds: [embed] });
              return { success: true, thread: false };
            }
            else {
              throw new Error('Tipo de canal no soportado para hilos');
            }
          } catch (err) {
            throw err;
          }
        }

        try {
          const resultado = await enviarAHilo(CANAL_REGISTRO_LOCAL, embedRegistro, 'Ventas Armamento');
          exitos++;
          if (resultado.thread) console.log(`[REGISTRO] Hilo creado/enviado en canal local`);
        } catch (err) {
          fallos++;
          errores.push(`Canal local: ${err.message}`);
          console.error('[REGISTRO] Error canal local:', err.message);
        }

        try {
          const resultado = await enviarAHilo(CANAL_REGISTRO_EXTERNO, embedRegistro, 'Ventas Armamento');
          exitos++;
          if (resultado.thread) console.log(`[REGISTRO] Hilo creado/enviado en canal externo`);
        } catch (err) {
          fallos++;
          errores.push(`Canal externo: ${err.message}`);
          console.error('[REGISTRO] Error canal externo:', err.message);
        }

        let titulo, color, mensaje;
        if (exitos === 2) {
          titulo = 'Registro Exitoso';
          color = 0x006400;
          mensaje = 'Venta registrada y enviada a ambos hilos correctamente.';
        } else if (exitos === 1) {
          titulo = 'Registro Parcial';
          color = 0xB8860B;
          mensaje = 'Venta enviada a 1 de 2 hilos.';
        } else {
          titulo = 'Fallo Total';
          color = 0x8B0000;
          mensaje = 'No se pudo enviar a ningun hilo. Guardado localmente.';
        }

        const embedRespuesta = new EmbedBuilder()
          .setColor(color)
          .setTitle(titulo)
          .setDescription(
            `${mensaje}\n\n` +
            `**Detalles:**\n` +
            `Vendedor: ${vendedor}\n` +
            `Comprador: ${comprador}\n` +
            `Arma: ${arma}\n` +
            `Precio: ${formatearPrecio(precio)}\n` +
            `Mes: ${obtenerNombreMes(claveMes)}\n` +
            `${hilosCreados.length > 0 ? `\n**Hilos creados:** ${hilosCreados.join(', ')}` : ''}`
          );

        if (fallos > 0) {
          embedRespuesta.addFields({ 
            name: 'Errores', 
            value: errores.join('\n') 
          });
        }

        const totalMes = registrosArmamento[claveMes].reduce((suma, reg) => suma + reg.precio, 0);
        embedRespuesta.addFields({
          name: 'Total Acumulado del Mes',
          value: `${formatearPrecio(totalMes)} (${registrosArmamento[claveMes].length} ventas)`,
          inline: false
        });

        await interaction.editReply({ embeds: [embedRespuesta] });
        break;
      }

      case 'armes': {
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

        const ahora = new Date();
        const claveMesActual = obtenerClaveMes(ahora);
        const nombreMesActual = obtenerNombreMes(claveMesActual);

        const registrosMes = registrosArmamento[claveMesActual] || [];
        const totalMes = registrosMes.reduce((suma, reg) => suma + reg.precio, 0);

        const mesesDisponibles = Object.keys(registrosArmamento).sort().reverse();

        let descripcion = `**Resumen de ventas: ${nombreMesActual}**\n\n`;

        if (registrosMes.length === 0) {
          descripcion += `No hay registros de ventas de armamento este mes.\n`;
        } else {
          descripcion += `**Total de ventas:** ${registrosMes.length}\n`;
          descripcion += `**Dinero total recaudado:** ${formatearPrecio(totalMes)}\n\n`;

          descripcion += `**Detalle de ventas:**\n`;
          registrosMes.forEach((reg, index) => {
            descripcion += `${index + 1}. ${reg.arma} — ${formatearPrecio(reg.precio)} (${reg.vendedor} → ${reg.comprador})\n`;
          });
        }

        if (mesesDisponibles.length > 1) {
          descripcion += `\n**Historial mensual:**\n`;
          mesesDisponibles.forEach(mes => {
            if (mes === claveMesActual) return;
            const total = registrosArmamento[mes].reduce((s, r) => s + r.precio, 0);
            const cantidad = registrosArmamento[mes].length;
            descripcion += `${obtenerNombreMes(mes)}: ${formatearPrecio(total)} (${cantidad} ventas)\n`;
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('RESUMEN MENSUAL DE VENTAS DE ARMAMENTO')
          .setDescription(descripcion)
          .setTimestamp()
          .setFooter({ 
            text: `Solicitado por ${interaction.user.tag} | USMC Armamento` 
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
        if (!verificarRolesMultiples(interaction, [ROL_UNIDADES, ROL_PACAS])) {
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
        if (!verificarRolesMultiples(interaction, [ROL_UNIDADES, ROL_PACAS])) {
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

      case 'pacade': {
        if (!verificarRol(interaction, ROL_PACAS)) {
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

        const periodoInicio = interaction.options.getString('periodo_inicio');
        const periodoFin = interaction.options.getString('periodo_fin');
        const montoRaw = interaction.options.getString('monto');
        const captura = interaction.options.getAttachment('captura');

        const montoLimpio = montoRaw.replace(/[$,.\s]/g, '');
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

        if (!registrosPacas[claveMes]) {
          registrosPacas[claveMes] = [];
        }

        registrosPacas[claveMes].push({
          monto: monto,
          periodoInicio: periodoInicio,
          periodoFin: periodoFin,
          usuario: interaction.user.tag,
          timestamp: ahora.toISOString()
        });

        const embedPaca = new EmbedBuilder()
          .setColor(0x8B0000)
          .setDescription(
            `# __Dinero recolectado__\n\n` +
            `**Del ${periodoInicio} al ${periodoFin}**\n\n` +
            `# ${formatearPrecio(monto)}`
          )
          .setImage(captura.url)
          .setTimestamp()
          .setFooter({ 
            text: `Registrado por ${interaction.user.tag}` 
          });

        let enviado = false;

        try {
          const canalUnidades = await client.channels.fetch(CANAL_UNIDADES);
          console.log(`[PACAS] Canal: ${canalUnidades.name} | Tipo: ${canalUnidades.type}`);

          const esCanalValido = [
            ChannelType.GuildText,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread,
            ChannelType.GuildForum
          ].includes(canalUnidades.type);

          if (esCanalValido) {
            await canalUnidades.send({ embeds: [embedPaca] });
            console.log('[PACAS] Enviado correctamente');
            enviado = true;
          } else {
            throw new Error(`Tipo no soportado: ${canalUnidades.type}`);
          }
        } catch (err) {
          console.error('[PACAS] Error:', err.message);
        }

        const embedRespuesta = new EmbedBuilder()
          .setColor(enviado ? 0x006400 : 0xB8860B)
          .setTitle(enviado ? 'Registro Guardado' : 'Registro Guardado (Local)')
          .setDescription(
            `**Dinero de pacas registrado**\n\n` +
            `Periodo: ${periodoInicio} al ${periodoFin}\n` +
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

      case 'pmes': {
        if (!verificarRol(interaction, ROL_PACAS)) {
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

        const registrosMes = registrosPacas[claveMesActual] || [];
        const totalMes = registrosMes.reduce((suma, reg) => suma + reg.monto, 0);

        const mesesDisponibles = Object.keys(registrosPacas).sort().reverse();

        let descripcion = `**Resumen del mes: ${nombreMesActual}**\n\n`;

        if (registrosMes.length === 0) {
          descripcion += `No hay registros de dinero de pacas este mes.\n`;
        } else {
          descripcion += `**Total de registros:** ${registrosMes.length}\n`;
          descripcion += `**Dinero total recolectado:** ${formatearPrecio(totalMes)}\n\n`;

          descripcion += `**Detalle de registros:**\n`;
          registrosMes.forEach((reg, index) => {
            descripcion += `${index + 1}. Del ${reg.periodoInicio} al ${reg.periodoFin} — ${formatearPrecio(reg.monto)}\n`;
          });
        }

        if (mesesDisponibles.length > 1) {
          descripcion += `\n**Historial mensual:**\n`;
          mesesDisponibles.forEach(mes => {
            if (mes === claveMesActual) return;
            const total = registrosPacas[mes].reduce((s, r) => s + r.monto, 0);
            const cantidad = registrosPacas[mes].length;
            descripcion += `${obtenerNombreMes(mes)}: ${formatearPrecio(total)} (${cantidad} registros)\n`;
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('RESUMEN MENSUAL DE DINERO DE PACAS')
          .setDescription(descripcion)
          .setTimestamp()
          .setFooter({ 
            text: `Solicitado por ${interaction.user.tag} | USMC Pacas` 
          });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ==================== ANUNCIOS MEJORADO - ESTILO MILITAR ====================
      case 'anuncios': {
        if (!verificarRol(interaction, ROL_ANUNCIOS)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('ACCESO DENEGADO')
                .setDescription('No tienes permiso para emitir comunicados oficiales.')
            ],
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });

        const titulo = interaction.options.getString('titulo');
        const contenido = interaction.options.getString('contenido');
        const tipo = interaction.options.getString('tipo');
        const fechaEvento = interaction.options.getString('fecha_evento');
        const horaEvento = interaction.options.getString('hora_evento');
        const zonaHoraria = interaction.options.getString('zona_horaria');
        const horariosRaw = interaction.options.getString('horarios');
        const obligatorio = interaction.options.getString('obligatorio');
        const firma = interaction.options.getString('firma');
        const imagen = interaction.options.getAttachment('imagen');
        const mencion = interaction.options.getString('mencion');

        // Formatear fecha actual militar
        const ahora = new Date();
        const fechaActual = formatearFechaMilitar(ahora);

        // Titulos por tipo
        const titulosTipo = {
          reunion_leadership: 'REUNION LEADERSHIP',
          comunicado: 'COMUNICADO OFICIAL',
          alerta: 'ALERTA / AVISO',
          entrenamiento: 'ENTRENAMIENTO PROGRAMADO',
          promocion: 'PROMOCION OFICIAL',
          evento: 'EVENTO ESPECIAL'
        };

        const tituloFormateado = titulosTipo[tipo] || 'COMUNICADO OFICIAL';

        // Construir descripcion del anuncio
        let descripcionAnuncio = '';

        // Encabezado militar
        descripcionAnuncio += `**${tituloFormateado}**\n\n`;
        descripcionAnuncio += `${contenido}\n\n`;

        // Asistencia obligatoria
        if (obligatorio === 'si') {
          descripcionAnuncio += `**ASISTENCIA:** Totalmente obligatoria. Temas importantes seran tratados.\n\n`;
        } else if (obligatorio === 'no') {
          descripcionAnuncio += `**ASISTENCIA:** Opcional.\n\n`;
        }

        // Horarios
        let tieneHorarios = false;
        let horariosTexto = '';

        if (fechaEvento && horaEvento) {
          tieneHorarios = true;
          const fechaHoraEvento = parsearFechaHora(fechaEvento, horaEvento);
          const tiempoRestante = calcularTiempoRestante(fechaHoraEvento);
          
          horariosTexto += `**FECHA DEL EVENTO:** ${fechaEvento}\n`;
          horariosTexto += `**INICIA:** ${tiempoRestante}\n\n`;
          horariosTexto += `**HORARIOS:**\n`;
          
          // Zona horaria base
          if (zonaHoraria) {
            horariosTexto += `${zonaHoraria}: ${horaEvento}\n`;
          } else {
            horariosTexto += `Hora base: ${horaEvento}\n`;
          }

          // Horarios adicionales
          if (horariosRaw) {
            const horariosExtra = horariosRaw.split(',').map(h => h.trim());
            horariosExtra.forEach(h => {
              const partes = h.split(':');
              if (partes.length >= 2) {
                const pais = partes[0].trim();
                const hora = partes.slice(1).join(':').trim();
                horariosTexto += `${pais}: ${hora}\n`;
              }
            });
          }

          horariosTexto += `\n**Timestamp:** ${formatearTimestampDiscord(fechaHoraEvento)} (${formatearTimestampRelativo(fechaHoraEvento)})`;
        }

        if (tieneHorarios) {
          descripcionAnuncio += horariosTexto + '\n\n';
        }

        // Firma
        descripcionAnuncio += `---\n`;
        descripcionAnuncio += `**Firma Y Sello:** `;
        if (firma) {
          descripcionAnuncio += `${interaction.user} | ${firma}`;
        } else {
          descripcionAnuncio += `${interaction.user.tag}`;
        }

        // Crear embed
        const embedAnuncio = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle(`${fechaActual} | United States Marine Corps`)
          .setDescription(descripcionAnuncio)
          .setTimestamp()
          .setFooter({ 
            text: 'Leadership Company of Texas | USMC Comunicados Oficiales',
            iconURL: interaction.guild?.iconURL({ dynamic: true }) || null
          });

        if (imagen?.url) {
          embedAnuncio.setImage(imagen.url);
        }

        // Mencion
        let contenidoMencion = '';
        if (mencion) {
          if (mencion === '@everyone') contenidoMencion = '@everyone';
          else if (mencion === '@here') contenidoMencion = '@here';
          else if (mencion.match(/^\d+$/)) contenidoMencion = `<@&${mencion}>`;
          else contenidoMencion = mencion;
        }

        try {
          const canalAnuncios = await client.channels.fetch(CANAL_ANUNCIOS);
          
          const esCanalValido = [
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.PublicThread,
            ChannelType.AnnouncementThread
          ].includes(canalAnuncios.type);

          if (!esCanalValido) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x8B0000)
                  .setTitle('ERROR')
                  .setDescription('El canal de anuncios no es valido.')
              ]
            });
          }

          const mensajeEnviado = await canalAnuncios.send({
            content: contenidoMencion || undefined,
            embeds: [embedAnuncio]
          });

          // Crosspost si es canal de anuncios
          if (canalAnuncios.type === ChannelType.GuildAnnouncement && mensajeEnviado.crosspost) {
            await mensajeEnviado.crosspost().catch(() => {});
          }

          // Embed de confirmacion
          let confirmDesc = `**Comunicado emitido exitosamente**\n\n`;
          confirmDesc += `**Titulo:** ${titulo}\n`;
          confirmDesc += `**Tipo:** ${tituloFormateado}\n`;
          confirmDesc += `**Canal:** <#${CANAL_ANUNCIOS}>\n`;
          if (mencion) confirmDesc += `**Mencion:** ${mencion}\n`;
          if (tieneHorarios) confirmDesc += `**Evento programado:** ${fechaEvento} ${horaEvento}\n`;
          confirmDesc += `\n[Ver Comunicado](${mensajeEnviado.url})`;

          const embedConfirmacion = new EmbedBuilder()
            .setColor(0x006400)
            .setTitle('COMUNICADO PUBLICADO')
            .setDescription(confirmDesc)
            .setTimestamp();

          await interaction.editReply({ embeds: [embedConfirmacion] });

        } catch (err) {
          console.error('[ANUNCIOS] Error:', err.message);
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('ERROR DEL SISTEMA')
                .setDescription(`No se pudo emitir el comunicado: ${err.message}`)
            ]
          });
        }
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
