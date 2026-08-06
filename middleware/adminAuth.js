// Middleware de HTTP Basic Auth para proteger todo lo que cuelgue de /admin.
// Una sola cuenta (sin sesión/cookies, sin sistema de usuarios) — alcanza
// para el uso actual (el dueño del negocio revisando el reporte del día).
//
// Fail closed: si ADMIN_PASSWORD no está configurado en el entorno, /admin
// responde 503 en vez de quedar abierto sin protección o con un password
// default adivinable. ADMIN_USER sí tiene un default ("admin") porque no es
// secreto — lo que protege el acceso es la contraseña.
const crypto = require('crypto');

// Compara dos strings en tiempo constante sin filtrar la diferencia de
// longitud por timing (mismo patrón que verifyWebhookSignature en
// lib/mercadopago.js).
function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Igual hacemos una comparación de tiempo constante (contra sí mismo)
    // para no dar una señal de timing extra sobre "longitud incorrecta".
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function adminAuthMiddleware(req, res, next) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    console.error(
      'ADMIN_PASSWORD no está configurado: /admin deshabilitado (fail closed). ' +
      'Configura ADMIN_USER y ADMIN_PASSWORD en el entorno para habilitar el panel.'
    );
    return res.status(503).json({
      error: 'Panel de administración no disponible: falta configurar ADMIN_PASSWORD en el entorno.'
    });
  }

  const configuredUser = process.env.ADMIN_USER || 'admin';

  const authHeader = req.headers.authorization || '';
  const [scheme, encodedCredentials] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encodedCredentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  let decoded;
  try {
    decoded = Buffer.from(encodedCredentials, 'base64').toString('utf8');
  } catch (error) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Autenticación inválida' });
  }

  const separatorIdx = decoded.indexOf(':');
  const providedUser = separatorIdx === -1 ? decoded : decoded.slice(0, separatorIdx);
  const providedPassword = separatorIdx === -1 ? '' : decoded.slice(separatorIdx + 1);

  const userMatches = timingSafeEqualStrings(providedUser, configuredUser);
  const passwordMatches = timingSafeEqualStrings(providedPassword, configuredPassword);

  if (!userMatches || !passwordMatches) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  next();
}

module.exports = adminAuthMiddleware;
