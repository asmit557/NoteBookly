import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import React from "react";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const c = {
  bg: "#060610",
  card: "#0f0f1a",
  cardInner: "#16162a",
  border: "#1e1e35",
  accent: "#6c63ff",
  accentLight: "#a78bfa",
  accentMuted: "#1c1a3a",
  text: "#f0f0f5",
  muted: "#9ca3af",
  subtle: "#6b7280",
  success: "#34d399",
  white: "#ffffff",
};

// ── Feature data ──────────────────────────────────────────────────────────────

const features = [
  {
    icon: "📄",
    title: "Notebook → PDF",
    desc: "Convert any .ipynb file to a polished PDF in seconds.",
  },
  {
    icon: "🎨",
    title: "Light & Dark Themes",
    desc: "Choose between clean light or rich dark PDF output.",
  },
  {
    icon: "☁️",
    title: "Cloud Storage",
    desc: "Every conversion is saved and accessible from your dashboard.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>
        Welcome to NoteBookly — your Jupyter notebooks, beautifully converted to PDF.
      </Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* ── Accent top bar ── */}
          <Section style={styles.accentBar} />

          {/* ── Header ── */}
          <Section style={styles.header}>
            <Row>
              <Column align="center">
                {/* Logo mark */}
                <table
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ margin: "0 auto 12px" }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: c.accent,
                          borderRadius: 8,
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: 18,
                          color: c.white,
                          fontWeight: 700,
                          boxShadow: `0 0 18px rgba(108,99,255,0.5)`,
                        }}
                      >
                        N
                      </td>
                    </tr>
                  </tbody>
                </table>

                <Text style={styles.brandName}>NoteBookly</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Main card ── */}
          <Section style={styles.card}>

            {/* Greeting */}
            <Heading style={styles.h1}>
              Welcome aboard,{" "}
              <span style={{ color: c.accentLight }}>{name}</span>
            </Heading>

            <Text style={styles.intro}>
              Your account is all set. NoteBookly converts Jupyter notebooks into
              beautifully formatted PDFs — ready to share, present, or archive.
            </Text>

            <Hr style={styles.divider} />

            {/* Features */}
            <Text style={styles.sectionLabel}>WHAT YOU CAN DO</Text>

            {features.map((f) => (
              <table
                key={f.title}
                cellPadding={0}
                cellSpacing={0}
                width="100%"
                style={styles.featureRow}
              >
                <tbody>
                  <tr>
                    <td style={styles.featureIcon}>{f.icon}</td>
                    <td style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}

            <Hr style={styles.divider} />

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, paddingTop: 8 }}>
              <Button href={appUrl} style={styles.cta}>
                Start Converting →
              </Button>
            </Section>

            <Text style={styles.ctaNote}>
              Drop a .ipynb file on the homepage or your dashboard — no
              configuration required.
            </Text>
          </Section>

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>NoteBookly</Text>
            <Text style={styles.footerText}>
              You received this email because you signed up for NoteBookly.
            </Text>
            <Text style={styles.footerText}>
              <Link href={appUrl} style={styles.footerLink}>
                Visit app
              </Link>
              {" · "}
              <Link href={`${appUrl}/dashboard`} style={styles.footerLink}>
                Dashboard
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Factory (use in .ts files where JSX isn't available) ──────────────────────

export function createWelcomeEmail(props: WelcomeEmailProps): React.ReactElement {
  return <WelcomeEmail {...props} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: c.bg,
    margin: 0,
    padding: "40px 0",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },

  container: {
    maxWidth: 560,
    margin: "0 auto",
  },

  accentBar: {
    height: 4,
    background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})`,
    borderRadius: "8px 8px 0 0",
  },

  header: {
    backgroundColor: c.card,
    padding: "32px 40px 24px",
    textAlign: "center" as const,
    borderLeft: `1px solid ${c.border}`,
    borderRight: `1px solid ${c.border}`,
  },

  brandName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: c.text,
  },

  card: {
    backgroundColor: c.card,
    padding: "0 40px 40px",
    borderLeft: `1px solid ${c.border}`,
    borderRight: `1px solid ${c.border}`,
  },

  h1: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: "1.3",
    color: c.text,
    margin: "0 0 16px",
  },

  intro: {
    fontSize: 15,
    lineHeight: "1.7",
    color: c.muted,
    margin: "0 0 24px",
  },

  divider: {
    borderColor: c.border,
    borderStyle: "solid",
    borderWidth: "0 0 1px",
    margin: "24px 0",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: c.subtle,
    textTransform: "uppercase" as const,
    margin: "0 0 16px",
  },

  featureRow: {
    marginBottom: 14,
    backgroundColor: c.cardInner,
    borderRadius: 10,
    padding: "12px 16px",
  },

  featureIcon: {
    width: 36,
    fontSize: 20,
    paddingRight: 12,
    verticalAlign: "top",
    paddingTop: 2,
  },

  featureContent: {
    verticalAlign: "top",
  },

  featureTitle: {
    margin: "0 0 2px",
    fontSize: 13,
    fontWeight: 600,
    color: c.text,
    lineHeight: "1.4",
  },

  featureDesc: {
    margin: 0,
    fontSize: 12,
    color: c.muted,
    lineHeight: "1.5",
  },

  cta: {
    display: "inline-block",
    backgroundColor: c.accent,
    color: c.white,
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    padding: "12px 28px",
    textDecoration: "none",
    letterSpacing: "0.01em",
  },

  ctaNote: {
    fontSize: 12,
    color: c.subtle,
    textAlign: "center" as const,
    margin: "16px 0 0",
    lineHeight: "1.5",
  },

  footer: {
    padding: "24px 40px",
    textAlign: "center" as const,
    backgroundColor: c.card,
    borderLeft: `1px solid ${c.border}`,
    borderRight: `1px solid ${c.border}`,
    borderBottom: `1px solid ${c.border}`,
    borderRadius: "0 0 8px 8px",
  },

  footerBrand: {
    margin: "0 0 6px",
    fontSize: 13,
    fontWeight: 600,
    color: c.muted,
  },

  footerText: {
    margin: "0 0 4px",
    fontSize: 11,
    color: c.subtle,
    lineHeight: "1.6",
  },

  footerLink: {
    color: c.accent,
    textDecoration: "none",
  },
} as const;
