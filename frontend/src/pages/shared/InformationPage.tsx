import { AppShell } from "../../components/layout/AppShell";

type InformationPageKind = "terms" | "privacy" | "contact";

const content: Record<InformationPageKind, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Terms of Service",
    paragraphs: [
      "By using this Dental Clinic system, users agree to provide accurate information and use the platform only for legitimate appointment and clinic-related purposes.",
      "Appointment availability is subject to dentist schedules and clinic operating hours. The clinic may confirm, reschedule, or cancel appointments when necessary.",
      "This platform is intended to support appointment scheduling, patient management, treatment records, and billing workflows. It is not intended for emergency medical situations. In case of a medical emergency, contact the appropriate emergency services.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "We respect the privacy of our patients and users. Personal information collected through this system may include contact details, appointment information, treatment records, and billing information necessary for clinic operations.",
      "Access to information is restricted according to user roles and responsibilities. Patient and clinic information should only be accessed for authorized purposes.",
      "We take reasonable measures to protect stored information and prevent unauthorized access, modification, or disclosure.",
    ],
  },
  contact: {
    title: "Contact",
    paragraphs: [
      "If you have questions about your appointment, account, billing, or clinic services, please contact the clinic reception team.",
      "Our staff can assist with appointment scheduling, rescheduling, cancellations, and general account-related questions.",
    ],
  },
};

export function InformationPage({ kind }: { kind: InformationPageKind }) {
  const { title, paragraphs } = content[kind];

  return (
    <AppShell pageTitle={title}>
      <section className="card p-4" style={{ maxWidth: 760 }} aria-labelledby="information-title">
        <h2 id="information-title" className="h4 mb-3">{title}</h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-helper mb-3">{paragraph}</p>
        ))}
      </section>
    </AppShell>
  );
}
