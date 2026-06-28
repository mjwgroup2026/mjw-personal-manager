import LegalPageLayout from "@/components/LegalPageLayout";

const DataProtection = () => (
  <LegalPageLayout title="Data Policy">
    <p className="text-xs italic">Effective date: 01 March 2026 · Last updated: 01 March 2026</p>

    <p>Ledgera is part of MJW Group.</p>
    <p>This Data Policy explains how Ledgera classifies, handles, protects, stores, exports, and governs data inside the platform.</p>

    <h2>1. Purpose</h2>
    <p>Ledgera is designed to hold sensitive financial and operational business information, including accounting records, invoices, supporting documents, VAT-related records, tax summaries, and audit trails.</p>
    <p>This Data Policy sets the platform standard for:</p>
    <ul>
      <li>data classification</li>
      <li>data access</li>
      <li>data handling</li>
      <li>data storage</li>
      <li>data export</li>
      <li>data retention</li>
      <li>data integrity</li>
      <li>data responsibility</li>
    </ul>

    <h2>2. Data categories inside Ledgera</h2>
    <p>Ledgera may process the following data categories:</p>

    <h3>2.1 Account data</h3>
    <ul><li>user names</li><li>email addresses</li><li>roles</li><li>login records</li><li>account settings</li></ul>

    <h3>2.2 Entity data</h3>
    <ul><li>legal names</li><li>trading names</li><li>registration information</li><li>VAT details</li><li>invoice settings</li><li>payment details</li><li>tax configuration</li></ul>

    <h3>2.3 Financial records</h3>
    <ul><li>invoices</li><li>invoice lines</li><li>income transactions</li><li>expense transactions</li><li>customer and supplier records</li><li>VAT period records</li><li>income tax summary records</li><li>vehicle schedules</li><li>import records</li></ul>

    <h3>2.4 Supporting documents</h3>
    <ul><li>receipts</li><li>tax invoices</li><li>supplier invoices</li><li>credit notes</li><li>debit notes</li><li>statements</li><li>attachments uploaded by users</li></ul>

    <h3>2.5 Governance and control data</h3>
    <ul><li>audit logs</li><li>change history</li><li>lock status</li><li>review status</li><li>export history</li></ul>

    <h2>3. Data ownership and responsibility</h2>
    <p>The platform is operated by MJW Group.</p>
    <p>Users remain responsible for:</p>
    <ul><li>the lawfulness of the data they upload</li><li>ensuring they have authority to store third-party information in Ledgera</li><li>checking the correctness of accounting, tax, VAT, invoice, and supporting data</li><li>protecting access to their own accounts and devices</li><li>managing who they authorise inside each entity</li></ul>

    <h2>4. Access control</h2>
    <p>Ledgera uses access controls to protect data.</p>
    <p>Core principles:</p>
    <ul><li>access is role-based</li><li>access is entity-scoped</li><li>users should only see the data they are authorised to see</li><li>audit-sensitive actions should be logged</li><li>financial records should be versioned where relevant</li><li>locked periods should restrict normal editing</li></ul>
    <p>POPIA requires minimum conditions for lawful processing of personal information, and the Information Regulator is responsible for oversight and enforcement.</p>

    <h2>5. Data integrity</h2>
    <p>Ledgera is built to support reliable accounting and audit-ready recordkeeping.</p>
    <p>Data integrity controls should include:</p>
    <ul><li>required fields for key financial records</li><li>audit logging of material changes</li><li>version tracking for financial edits</li><li>edit-reason requirements where applicable</li><li>period locks</li><li>transaction-to-document linkage</li><li>entity-based segregation of records</li><li>export history tracking</li></ul>

    <h2>6. Data security</h2>
    <p>Ledgera applies reasonable security controls designed for a financial software environment, including:</p>
    <ul><li>authenticated access</li><li>permission controls</li><li>secure storage practices</li><li>document access restrictions</li><li>session and access monitoring</li><li>backup and recovery processes</li><li>controlled export workflows</li></ul>
    <p>We do not guarantee uninterrupted, error-free, or invulnerable systems. Security also depends on user behaviour, password protection, authorised access management, and proper handling of exports.</p>

    <h2>7. Data minimisation and purpose limitation</h2>
    <p>Ledgera aims to collect and process only the information reasonably necessary to:</p>
    <ul><li>operate the platform</li><li>provide accounting and tax-support functions</li><li>maintain audit trails</li><li>secure accounts</li><li>support reporting and exports</li><li>communicate with users</li><li>comply with legal obligations where applicable</li></ul>

    <h2>8. Data export and portability</h2>
    <p>Ledgera is designed to support business record export.</p>
    <p>Depending on the module and feature set, users may export:</p>
    <ul><li>invoices</li><li>reports</li><li>VAT support schedules</li><li>tax summaries</li><li>documents</li><li>audit records</li></ul>
    <p>Once data is exported, the user is responsible for the secure storage, transmission, and handling of that exported information.</p>

    <h2>9. Data retention and deletion</h2>
    <p>Ledgera retains data based on:</p>
    <ul><li>active account usage</li><li>document and recordkeeping needs</li><li>support and audit needs</li><li>legal and contractual obligations</li><li>platform backup and recovery processes</li></ul>
    <p>Deletion requests may be limited where data must be retained for:</p>
    <ul><li>legal compliance</li><li>audit integrity</li><li>dispute resolution</li><li>fraud prevention</li><li>security logs</li><li>backup or archival processes</li></ul>

    <h2>10. Cross-border and service-provider processing</h2>
    <p>Where service providers or infrastructure process data outside South Africa, Ledgera will use reasonable safeguards and service-provider controls appropriate to the nature of the processing.</p>

    <h2>11. Sensitive financial data handling</h2>
    <p>Because Ledgera stores financial and tax-related records, the following principles apply:</p>
    <ul><li>access should be limited to authorised persons</li><li>supporting documents should be linked and controlled</li><li>audit trails should be maintained</li><li>financial changes should be explainable</li><li>exports should be deliberate and traceable</li><li>document and record integrity should be prioritised over convenience</li></ul>

    <h2>12. Data subject requests and complaints</h2>
    <p>Where required by applicable law, Ledgera will respond to lawful data-related requests, including requests for access or correction, subject to identity verification, legal limitations, and operational constraints.</p>
    <p>POPIA provides data subjects with rights including access to personal information held by a responsible party.</p>

    <h2>13. Contact us</h2>
    <p>For data-related questions, requests, or concerns, contact:</p>
    <p>
      <strong>Ledgera / MJW Group</strong><br />
      Email: <a href="mailto:ledgera@mjwgroup.co.za" className="underline">ledgera@mjwgroup.co.za</a><br />
      Website: <a href="https://www.mjwgroup.co.za" target="_blank" rel="noopener noreferrer" className="underline">www.mjwgroup.co.za</a><br />
      Tel: 021 180 4244
    </p>
  </LegalPageLayout>
);

export default DataProtection;
