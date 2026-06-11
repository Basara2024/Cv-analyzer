import styles from "./privacy.module.css";

export const metadata = {
  title: "Políticas de Privacidad — Matchia",
  description: "Políticas de privacidad y tratamiento de datos de Matchia",
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>Matchia</span>
        </a>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <span className={styles.tag}>Legal</span>
          <h1 className={styles.title}>Políticas de Privacidad</h1>
          <p className={styles.date}>Última actualización: Junio 2026</p>
        </div>

        <div className={styles.content}>

          <section className={styles.section}>
            <h2>1. Información General</h2>
            <p>
              Matchia ("nosotros", "nuestro" o "la plataforma") es un servicio de análisis de hojas de vida mediante inteligencia artificial. Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestra plataforma en <strong>https://matchia.co</strong>.
            </p>
            <p>
              Al usar Matchia, aceptas las prácticas descritas en esta política. Si no estás de acuerdo, te pedimos que no uses nuestros servicios.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Información que Recopilamos</h2>
            <h3>2.1 Información que nos proporcionas directamente</h3>
            <ul>
              <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña al crear una cuenta.</li>
              <li><strong>Datos de autenticación social:</strong> si inicias sesión con Google, LinkedIn u otras plataformas, recibimos tu nombre, email y foto de perfil pública.</li>
              <li><strong>Contenido del CV:</strong> el texto extraído del archivo PDF que subes para análisis.</li>
            </ul>

            <h3>2.2 Información recopilada automáticamente</h3>
            <ul>
              <li>Historial de análisis realizados en la plataforma.</li>
              <li>Puntuaciones y resultados generados por nuestra IA.</li>
              <li>Datos técnicos como dirección IP, tipo de navegador y sistema operativo.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Cómo Usamos tu Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul>
              <li>Proveer, mantener y mejorar nuestros servicios de análisis de CV.</li>
              <li>Autenticar tu identidad y gestionar tu cuenta.</li>
              <li>Analizar tu CV mediante inteligencia artificial (Google Gemini 2.0 Flash) y generar feedback personalizado.</li>
              <li>Guardar tu historial de análisis para que puedas consultarlo posteriormente.</li>
              <li>Enviarte comunicaciones relacionadas con tu cuenta cuando sea necesario.</li>
              <li>Detectar y prevenir fraudes o usos indebidos de la plataforma.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Procesamiento de tu CV con Inteligencia Artificial</h2>
            <p>
              Cuando subes tu CV, el texto es extraído del PDF y enviado a la API de Google Gemini 2.0 Flash para su análisis. Este proceso es temporal y el contenido de tu CV no es almacenado permanentemente en servidores de terceros. Solo guardamos el resultado del análisis (puntuaciones y feedback) en nuestra base de datos.
            </p>
            <p>
              Te recomendamos no incluir información extremadamente sensible en tu CV como números de documentos de identidad completos, información bancaria o contraseñas.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Compartición de Datos</h2>
            <p>No vendemos, alquilamos ni compartimos tu información personal con terceros con fines comerciales. Solo compartimos datos con:</p>
            <ul>
              <li><strong>Google Gemini:</strong> para el procesamiento de análisis de CV mediante IA.</li>
              <li><strong>Supabase:</strong> como proveedor de base de datos donde se almacena tu información de forma segura.</li>
              <li><strong>Google:</strong> si usas el inicio de sesión con Google.</li>
              <li><strong>Autoridades competentes:</strong> cuando sea requerido por ley.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad para proteger tu información:</p>
            <ul>
              <li>Contraseñas encriptadas con bcrypt (salt 12).</li>
              <li>Comunicaciones cifradas mediante HTTPS/TLS.</li>
              <li>Autenticación mediante tokens JWT con expiración.</li>
              <li>Base de datos alojada en Supabase con cifrado en reposo.</li>
              <li>Servidor backend en AWS con acceso restringido.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>7. Retención de Datos</h2>
            <p>
              Conservamos tu información mientras tu cuenta esté activa. Si decides eliminar tu cuenta, tus datos personales y historial de análisis serán eliminados de nuestra base de datos en un plazo máximo de 30 días.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos o incompletos.</li>
              <li><strong>Eliminación:</strong> solicitar la eliminación de tu cuenta y datos.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
              <li><strong>Oposición:</strong> oponerte al procesamiento de tus datos en ciertos casos.</li>
            </ul>
            <p>Para ejercer estos derechos, contáctanos en: <strong>burgoschristian826@gmail.com</strong></p>
          </section>

          <section className={styles.section}>
            <h2>9. Cookies</h2>
            <p>
              Matchia utiliza cookies de sesión necesarias para mantener tu autenticación activa. No utilizamos cookies de rastreo ni publicidad de terceros.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Cambios a esta Política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos mediante un aviso en la plataforma o por correo electrónico. El uso continuado de Matchia después de los cambios implica tu aceptación.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Contacto</h2>
            <p>Si tienes preguntas sobre esta política de privacidad, contáctanos:</p>
            <ul>
              <li><strong>Email:</strong> burgoschristian826@gmail.com</li>
              <li><strong>Plataforma:</strong> https://matchia.co</li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  );
}
