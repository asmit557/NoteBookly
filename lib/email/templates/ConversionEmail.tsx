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

export interface ConversionEmailProps {
  name: string;
  notebookName: string;
  pdfName: string;
  pdfUrl: string;
  convertedAt: string;   // ISO string
  fileSize: string;      // e.g. "234 KB"
  theme: string;         // "light" | "dark"
  cellCount?: number;
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
  successBg: "#0a2a1e",
  white: "#ffffff",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversionEmail({
  name,
  notebookName,
  pdfName,
  pdfUrl,
  convertedAt,
  fileSize,
  theme,
  cellCount,
  appUrl,
}: ConversionEmailProps) {
  const detailRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Notebook",   value: notebookName },
    { label: "PDF",        value: pdfName },
    { label: "Converted",  value: formatDate(convertedAt) },
    { label: "File size",  value: fileSize },
    { label: "Theme",      value: theme.charAt(0).toUpperCase() + theme.slice(1) },
    ...(cellCount !== undefined ? [{ label: "Cells", value: String(cellCount) }] : []),
    { label: "Status",     value: "✓ Success", highlight: true },
  ];

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>
        Your PDF is ready — {pdfName} has been generated successfully.
      </Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* ── Accent top bar ── */}
          <Section style={styles.accentBar} />

          {/* ── Header ── */}
          <Section style={styles.header}>
            <Row>
              <Column>
                {/* Logo mark */}
                <table
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ marginBottom: 12 }}
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

          {/* ── Success banner ── */}
          <Section style={styles.successBanner}>
            <Text style={styles.successText}>
              ✓&nbsp;&nbsp;Conversion Successful
            </Text>
          </Section>

          {/* ── Main card ── */}
          <Section style={styles.card}>

            <Heading style={styles.h1}>
              Your PDF is ready,{" "}
              <span style={{ color: c.accentLight }}>{name}</span>
            </Heading>

            <Text style={styles.intro}>
              <strong style={{ color: c.text }}>{notebookName}</strong> has been
              converted and is now available for download.
            </Text>

            <Hr style={styles.divider} />

            {/* Details table */}
            <Text style={styles.sectionLabel}>CONVERSION DETAILS</Text>

            <table
              cellPadding={0}
              cellSpacing={0}
              width="100%"
              style={styles.detailsTable}
            >
              <tbody>
                {detailRows.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? c.cardInner : "transparent",
                    }}
                  >
                    <td style={styles.detailLabel}>{row.label}</td>
                    <td
                      style={{
                        ...styles.detailValue,
                        ...(row.highlight ? styles.detailHighlight : {}),
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Hr style={styles.divider} />

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, paddingTop: 8 }}>
              <Button href={pdfUrl} style={styles.cta}>
                Download PDF →
              </Button>
            </Section>

            <Text style={styles.ctaNote}>
              Your PDF is also available in your{" "}
              <Link href={`${appUrl}/dashboard`} style={styles.inlineLink}>
                dashboard
              </Link>{" "}
              for future access.
            </Text>

          </Section>

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>NoteBookly</Text>
            <Text style={styles.footerText}>
              This email was sent because a conversion was completed on your
              account.
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

export function createConversionEmail(
  props: ConversionEmailProps
): React.ReactElement {
  return <ConversionEmail {...props} />;
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
    padding: "32px 40px 20px",
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

  successBanner: {
    backgroundColor: c.successBg,
    borderLeft: `1px solid ${c.border}`,
    borderRight: `1px solid ${c.border}`,
    padding: "12px 40px",
    borderTop: `1px solid rgba(52,211,153,0.15)`,
    borderBottom: `1px solid rgba(52,211,153,0.15)`,
  },

  successText: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: c.success,
    letterSpacing: "0.01em",
  },

  card: {
    backgroundColor: c.card,
    padding: "32px 40px 40px",
    borderLeft: `1px solid ${c.border}`,
    borderRight: `1px solid ${c.border}`,
  },

  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: "1.3",
    color: c.text,
    margin: "0 0 14px",
  },

  intro: {
    fontSize: 14,
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
    margin: "0 0 12px",
  },

  detailsTable: {
    borderRadius: 10,
    overflow: "hidden",
    border: `1px solid ${c.border}`,
  },

  detailLabel: {
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 500,
    color: c.subtle,
    width: "38%",
    verticalAlign: "middle" as const,
    borderBottom: `1px solid ${c.border}`,
  },

  detailValue: {
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: c.text,
    verticalAlign: "middle" as const,
    borderBottom: `1px solid ${c.border}`,
    wordBreak: "break-all" as const,
  },

  detailHighlight: {
    color: c.success,
    fontWeight: 600,
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

  inlineLink: {
    color: c.accent,
    textDecoration: "underline",
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
