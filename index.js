const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ChannelType,
  PermissionFlagsBits,
  Colors
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
const GUILD_REGISTRO_EXTERNO = '1464318287683780836';
const CANAL_REGISTRO_EXTERNO = '1477760530125947183';

// Paleta de colores (tema militar profesional)
const THEME = {
  primary: 0x8B0000,      // Rojo oscuro
  secondary: 0x2F4F4F,    // Gris pizarra
  success: 0x006400,      // Verde oscuro
  warning: 0xB8860B,      // Dorado oscuro
  error: 0x8B0000,        // Rojo sangre
  info: 0x191970          // Azul medianoche
};

// ==================== BASE DE DATOS DE ARMAMENTO ====================
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
    descripcion: 'Pistola de alto calibre, peso considerable'
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

// ==================== UTILIDADES ====================
function crearEmbed(titulo, descripcion, color = THEME.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(titulo)
    .setDescription(descripcion)
    .setTimestamp()
    .setFooter({ 
      text: 'USMC Sistema de Armamento | United States Marine Corps',
      iconURL: null 
    });
}

function formatearPrecio(cantidad) {
  return `$${cantidad.toLocaleString('en-US')}`;
}

function buscarArma(entrada) {
  if (!entrada) return null;
  const clave = entrada.toLowerCase().replace(/[-\s]/g, '');
  return CATALOGO_ARMAS[clave] || null;
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
        .setDescription('Primera arma')
        .setRequired(true)
        .setAutocomplete(true)
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
    )

].map(c => c.toJSON());

// ==================== REGISTRO DE COMANDOS ====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log(`[READY] Bot conectado como ${client.user.tag}`);
  console.log(`[INFO] Servidores: ${client.guilds.cache.size}`);
  
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('[SUCCESS] Comandos slash registrados correctamente');
  } catch (error) {
    console.error('[ERROR] Fallo al registrar comandos:', error);
  }
});

// ==================== MANEJADOR DE INTERACCIONES ====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {

      // ==================== ARMAMENTO ====================
      case 'armamento': {
        let descripcionArmas = '';
        let descripcionPacks = '';
        
        // Organizar armas por categoria
        const categorias = {};
        Object.values(CATALOGO_ARMAS).forEach(arma => {
          if (!categorias[arma.categoria]) categorias[arma.categoria] = [];
          categorias[arma.categoria].push(
            `**${arma.nombre}** — ${formatearPrecio(arma.precio)}\n` +
            `> ${arma.descripcion}\n` +
            `> Requisito: ${arma.requisito}\n`
          );
        });

        Object.entries(categorias).forEach(([cat, armas]) => {
          descripcionArmas += `\n**[ ${cat.toUpperCase()} ]**\n${armas.join('\n')}`;
        });

        // Organizar packs
        Object.values(CATALOGO_PACKS).forEach(pack => {
          descripcionPacks += 
            `\n**${pack.nombre}** — ${formatearPrecio(pack.total)}\n` +
            `> Armas: ${pack.armas.join(', ')}\n` +
            `> Ahorro: ${formatearPrecio(pack.ahorro)}\n`;
        });

        const embed = crearEmbed(
          'CATALOGO DE ARMAMENTO USMC',
          `Sistema de suministro del **United States Marine Corps**\n` +
          `Todos los precios estan en dolares estadounidenses.\n` +
          `Para compras individuales usa /pago | Para packs usa /pack\n\n` +
          `--- ARMAS INDIVIDUALES ---${descripcionArmas}\n\n` +
          `--- PACKS ESPECIALES ---${descripcionPacks}`,
          THEME.primary
        );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ==================== PAGO ====================
      case 'pago': {
        const armasInput = [
          interaction.options.getString('arma1'),
          interaction.options.getString('arma2'),
          interaction.options.getString('arma3'),
          interaction.options.getString('arma4')
        ].filter(Boolean);

        if (armasInput.length === 0) {
          return interaction.reply({
            embeds: [crearEmbed('ERROR', 'Debes especificar al menos un arma.', THEME.error)],
            ephemeral: true
          });
        }

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
            embeds: [crearEmbed(
              'ERROR DE SELECCION', 
              `Ninguna arma valida encontrada.\n\nIntentaste buscar:\n${itemsInvalidos.join('\n')}\n\n` +
              `Usa /armamento para ver el catalogo completo.`,
              THEME.error
            )],
            ephemeral: true
          });
        }

        let descripcion = `**ARTICULOS SELECCIONADOS**\n${itemsValidos.join('\n')}`;
        if (itemsInvalidos.length > 0) {
          descripcion += `\n\n**ARTICULOS NO ENCONTRADOS**\n${itemsInvalidos.join('\n')}`;
        }

        const embed = crearEmbed(
          'RESUMEN DE COMPRA',
          descripcion,
          THEME.success
        ).addFields(
          { name: 'TOTAL A PAGAR', value: `**${formatearPrecio(total)}**`, inline: false },
          { name: 'INSTRUCCIONES', value: 
            '1. Realiza el pago en la caja fuerte usando /donar\n' +
            '2. Toma captura del comprobante\n' +
            '3. Usa /registro para formalizar la compra', 
            inline: false 
          }
        );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ==================== PACK ====================
      case 'pack': {
        const tipo = interaction.options.getString('tipo');
        const pack = CATALOGO_PACKS[tipo];

        if (!pack) {
          return interaction.reply({
            embeds: [crearEmbed('ERROR', 'Pack no encontrado.', THEME.error)],
            ephemeral: true
          });
        }

        const embed = crearEmbed(
          pack.nombre.toUpperCase(),
          `**CONTENIDO DEL PACK**\n${pack.armas.map(a => `> ${a}`).join('\n')}\n\n` +
          `**AHORRO:** ${formatearPrecio(pack.ahorro)}`,
          THEME.info
        ).addFields(
          { name: 'PRECIO TOTAL', value: `**${formatearPrecio(pack.total)}**`, inline: true },
          { name: 'CANTIDAD', value: `${pack.armas.length} armas`, inline: true },
          { name: 'INSTRUCCIONES', value: 
            '1. Realiza el pago en la caja fuerte /donar\n' +
            '2. Guarda el comprobante\n' +
            '3. Usa /registro con tu captura', 
            inline: false 
          }
        );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      // ==================== REGISTRO ====================
      case 'registro': {
        await interaction.deferReply({ ephemeral: true });

        const vendedor = interaction.options.getString('vendedor');
        const comprador = interaction.options.getString('comprador');
        const arma = interaction.options.getString('arma');
        const precioRaw = interaction.options.getString('precio');
        const comprobante = interaction.options.getAttachment('comprobante');

        // Validaciones
        if (!comprobante?.url) {
          return interaction.editReply({
            embeds: [crearEmbed('ERROR', 'Debes adjuntar una imagen valida del comprobante.', THEME.error)]
          });
        }

        // Validar que el precio sea un numero
        const precioLimpio = precioRaw.replace(/[$,\s]/g, '');
        const precio = parseInt(precioLimpio);
        
        if (isNaN(precio) || precio <= 0) {
          return interaction.editReply({
            embeds: [crearEmbed('ERROR', `El precio "${precioRaw}" no es valido. Usa solo numeros.`, THEME.error)]
          });
        }

        // Crear embed profesional para los canales de registro
        const embedRegistro = new EmbedBuilder()
          .setColor(THEME.success)
          .setTitle('REGISTRO DE VENTA CONFIRMADO')
          .setDescription(`Transaccion registrada en el sistema USMC`)
          .addFields(
            { name: 'VENDEDOR', value: vendedor, inline: true },
            { name: 'COMPRADOR', value: comprador, inline: true },
            { name: 'ARTICULO', value: arma, inline: true },
            { name: 'MONTO', value: formatearPrecio(precio), inline: true },
            { name: 'FECHA', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            { name: 'CANAL', value: `<#${interaction.channelId}>`, inline: true }
          )
          .setImage(comprobante.url)
          .setTimestamp()
          .setFooter({ 
            text: `Registrado por ${interaction.user.tag} | ID: ${interaction.user.id}` 
          });

        const mensajeTexto = 
          `NUEVA VENTA REGISTRADA\n` +
          `========================\n` +
          `Vendedor: ${vendedor}\n` +
          `Comprador: ${comprador}\n` +
          `Articulo: ${arma}\n` +
          `Precio: ${formatearPrecio(precio)}\n` +
          `========================`;

        let exitos = 0;
        let fallos = 0;
        const errores = [];

        // ========== ENVIO AL CANAL LOCAL ==========
        try {
          const canalLocal = await client.channels.fetch(CANAL_REGISTRO_LOCAL);
          if (canalLocal && canalLocal.type === ChannelType.GuildText) {
            await canalLocal.send({ 
              content: mensajeTexto,
              embeds: [embedRegistro] 
            });
            exitos++;
          }
        } catch (err) {
          fallos++;
          errores.push(`Canal local: ${err.message}`);
          console.error('[REGISTRO] Error canal local:', err);
        }

        // ========== ENVIO AL CANAL EXTERNO ==========
        try {
          const canalExterno = await client.channels.fetch(CANAL_REGISTRO_EXTERNO);
          if (canalExterno && canalExterno.type === ChannelType.GuildText) {
            await canalExterno.send({ 
              content: mensajeTexto,
              embeds: [embedRegistro] 
            });
            exitos++;
          }
        } catch (err) {
          fallos++;
          errores.push(`Canal externo: ${err.message}`);
          console.error('[REGISTRO] Error canal externo:', err);
        }

        // Responder al usuario
        let estado;
        if (exitos === 2) {
          estado = `REGISTRO COMPLETADO\nSe envio correctamente a ambos canales de registro.`;
        } else if (exitos === 1) {
          estado = `REGISTRO PARCIAL\nSe envio a 1 de 2 canales. Revisa los permisos del bot.`;
        } else {
          estado = `FALLO TOTAL\nNo se pudo enviar a ningun canal.`;
        }

        const embedRespuesta = crearEmbed(
          exitos === 2 ? 'REGISTRO EXITOSO' : 'REGISTRO CON PROBLEMAS',
          estado,
          exitos === 2 ? THEME.success : (exitos === 1 ? THEME.warning : THEME.error)
        );

        if (fallos > 0) {
          embedRespuesta.addFields({ 
            name: 'ERRORES DETECTADOS', 
            value: errores.join('\n'), 
            inline: false 
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
    
    const mensajeError = crearEmbed(
      'ERROR DEL SISTEMA',
      'Ocurrio un error interno. Contacta a un administrador.',
      THEME.error
    );

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [mensajeError] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [mensajeError], ephemeral: true }).catch(() => {});
    }
  }
});

// ==================== MANEJO DE ERRORES GLOBALES ====================
client.on('error', error => {
  console.error('[CLIENT ERROR]', error);
});

process.on('unhandledRejection', error => {
  console.error('[UNHANDLED REJECTION]', error);
});

// ==================== LOGIN ====================
client.login(TOKEN).catch(err => {
  console.error('[FATAL] No se pudo iniciar sesion:', err);
  process.exit(1);
});
