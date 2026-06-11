import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { MatchiaLogo } from "./components/MatchiaLogo";
import {
  ZapIcon,
  TargetIcon,
  ClipboardCheckIcon,
  BarChartIcon,
  SearchIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  RefreshIcon,
  UsersIcon,
  UploadIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
} from "./components/Icons";

export const metadata: Metadata = {
  title: "Matchia — Llega a tu empleo soñado con IA",
  description:
    "Analiza tu CV con inteligencia artificial, recibe feedback accionable por sección y aumenta tus posibilidades de conseguir el trabajo que quieres.",
};

const REGISTER_HREF = "/auth?mode=register";
const LOGIN_HREF = "/auth?mode=login";

const benefits = [
  {
    Icon: ZapIcon,
    title: "Análisis en segundos",
    text: "Sube tu CV y obtén un diagnóstico completo al instante, sin esperas ni formularios eternos.",
  },
  {
    Icon: TargetIcon,
    title: "Puntuación por sección",
    text: "Conoce qué partes de tu CV brillan y cuáles restan, con una calificación clara para cada apartado.",
  },
  {
    Icon: ClipboardCheckIcon,
    title: "Feedback accionable",
    text: "Recomendaciones concretas y aplicables, no consejos genéricos. Sabes exactamente qué cambiar.",
  },
  {
    Icon: SearchIcon,
    title: "Optimizado para filtros ATS",
    text: "Detecta palabras clave y formato para que los sistemas de selección no descarten tu CV antes de tiempo.",
  },
  {
    Icon: BarChartIcon,
    title: "Mide tu progreso",
    text: "Compara versiones y observa cómo sube tu puntuación a medida que aplicas las mejoras.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Privado y seguro",
    text: "Tu información es tuya. Procesamos tu CV de forma segura y nunca lo compartimos con terceros.",
  },
];

const useCases = [
  {
    Icon: GraduationCapIcon,
    title: "Recién graduados",
    text: "Da el primer paso con un CV que compense la falta de experiencia destacando lo que sí tienes.",
  },
  {
    Icon: RefreshIcon,
    title: "Cambio de carrera",
    text: "Reorienta tu perfil hacia un nuevo sector resaltando tus habilidades transferibles.",
  },
  {
    Icon: BriefcaseIcon,
    title: "Profesionales con experiencia",
    text: "Sintetiza años de trayectoria en un CV claro, potente y enfocado al rol que buscas.",
  },
  {
    Icon: UsersIcon,
    title: "Quien busca activamente",
    text: "Adapta tu CV a cada vacante y aumenta tu tasa de respuesta en las postulaciones.",
  },
];

const steps = [
  {
    Icon: UploadIcon,
    title: "Sube tu CV",
    text: "Arrastra tu archivo en PDF. Sin registros interminables ni configuraciones.",
  },
  {
    Icon: SparklesIcon,
    title: "La IA lo analiza",
    text: "Evaluamos estructura, contenido, redacción y compatibilidad con filtros automáticos.",
  },
  {
    Icon: CheckIcon,
    title: "Mejora y postula",
    text: "Aplica las recomendaciones, mide tu nueva puntuación y lánzate a tu empleo soñado.",
  },
];

const faqs = [
  {
    q: "¿Necesito pagar para usar Matchia?",
    a: "Puedes crear tu cuenta y analizar tu CV gratis. Empieza sin tarjeta de crédito y descubre el valor antes de decidir nada.",
  },
  {
    q: "¿Qué formatos de CV puedo subir?",
    a: "Por ahora trabajamos con archivos PDF, el formato más usado en procesos de selección. Solo arrastra tu documento y listo.",
  },
  {
    q: "¿Qué tan preciso es el análisis?",
    a: "Usamos modelos de inteligencia artificial que evalúan tu CV en múltiples dimensiones: contenido, estructura, redacción y compatibilidad con sistemas ATS. El resultado es una guía clara y accionable.",
  },
  {
    q: "¿Mi información está segura?",
    a: "Sí. Procesamos tu CV de forma segura, lo usamos únicamente para generar tu análisis y no lo compartimos con terceros. Puedes leer más en nuestras políticas de privacidad.",
  },
  {
    q: "¿Para quién es Matchia?",
    a: "Para cualquier persona que busque empleo: recién graduados, profesionales con experiencia, quienes cambian de sector o postulan activamente. Si tienes un CV, Matchia te ayuda a mejorarlo.",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <MatchiaLogo className={styles.logoIcon} />
            <span className={styles.logoText}>Matchia</span>
          </Link>
          <nav className={styles.navLinks}>
            <Link href={LOGIN_HREF} className={styles.navLogin}>
              Iniciar sesión
            </Link>
            <Link href={REGISTER_HREF} className={styles.btnPrimary}>
              Empieza gratis
              <ArrowRightIcon className={styles.btnArrow} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>
            <SparklesIcon /> Análisis de CV con IA
          </span>
          <h1 className={styles.heroTitle}>
            Llega a tu <span className={styles.heroAccent}>empleo soñado</span>
          </h1>
          <p className={styles.heroSub}>
            Sube tu CV y recibe feedback detallado en segundos. Descubre qué mejorar,
            optimízalo para los filtros automáticos y destaca frente a cientos de candidatos.
          </p>
          <div className={styles.heroCtas}>
            <Link href={REGISTER_HREF} className={styles.btnPrimaryLg}>
              Crea tu cuenta gratis
              <ArrowRightIcon className={styles.btnArrow} />
            </Link>
            <Link href={LOGIN_HREF} className={styles.btnGhostLg}>
              Ya tengo cuenta
            </Link>
          </div>
          <p className={styles.heroNote}>
            <CheckIcon className={styles.heroNoteIcon} /> Sin tarjeta de crédito · Empieza en segundos
          </p>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroImageWrap}>
            <Image
              src="/community.jpg"
              alt="Profesionales jóvenes colaborando juntos"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
            <div className={styles.scoreCard}>
              <div className={styles.scoreHead}>
                <BarChartIcon className={styles.scoreIcon} />
                <span>Puntuación general</span>
              </div>
              <div className={styles.scoreValue}>
                92<span>/100</span>
              </div>
              <div className={styles.scoreBar}>
                <span style={{ width: "92%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Beneficios</span>
          <h2 className={styles.sectionTitle}>Todo lo que necesitas para destacar</h2>
          <p className={styles.sectionSub}>
            Matchia convierte tu CV en tu mejor carta de presentación con análisis impulsado por IA.
          </p>
        </div>
        <div className={styles.grid3}>
          {benefits.map(({ Icon, title, text }) => (
            <article className={styles.card} key={title}>
              <span className={styles.cardIcon}>
                <Icon />
              </span>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardText}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className={styles.sectionAlt}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Cómo funciona</span>
          <h2 className={styles.sectionTitle}>Tres pasos hacia tu próximo empleo</h2>
        </div>
        <div className={styles.steps}>
          {steps.map(({ Icon, title, text }, i) => (
            <div className={styles.step} key={title}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span className={styles.stepIcon}>
                <Icon />
              </span>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardText}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section id="casos-de-uso" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Casos de uso</span>
          <h2 className={styles.sectionTitle}>Pensado para tu momento profesional</h2>
          <p className={styles.sectionSub}>
            Sea cual sea tu punto de partida, Matchia se adapta a lo que necesitas.
          </p>
        </div>
        <div className={styles.grid2}>
          {useCases.map(({ Icon, title, text }) => (
            <article className={styles.useCase} key={title}>
              <span className={styles.useCaseIcon}>
                <Icon />
              </span>
              <div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardText}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.sectionAlt}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Preguntas frecuentes</span>
          <h2 className={styles.sectionTitle}>Resolvemos tus dudas</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map(({ q, a }) => (
            <details className={styles.faqItem} key={q}>
              <summary className={styles.faqQ}>
                {q}
                <span className={styles.faqMark} aria-hidden="true" />
              </summary>
              <p className={styles.faqA}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.ctaBand}>
        <h2 className={styles.ctaTitle}>Tu empleo soñado empieza por un buen CV</h2>
        <p className={styles.ctaSub}>
          Crea tu cuenta gratis y recibe tu primer análisis en segundos.
        </p>
        <Link href={REGISTER_HREF} className={styles.btnPrimaryLg}>
          Empieza gratis ahora
          <ArrowRightIcon className={styles.btnArrow} />
        </Link>
        <p className={styles.ctaLogin}>
          ¿Ya tienes cuenta?{" "}
          <Link href={LOGIN_HREF} className={styles.ctaLoginLink}>
            Inicia sesión
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.logo}>
            <MatchiaLogo className={styles.logoIcon} />
            <span className={styles.logoText}>Matchia</span>
          </Link>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacidad</Link>
            <Link href={LOGIN_HREF}>Iniciar sesión</Link>
            <Link href={REGISTER_HREF}>Crear cuenta</Link>
          </div>
          <span className={styles.footerCopy}>
            © {new Date().getFullYear()} Matchia. Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
