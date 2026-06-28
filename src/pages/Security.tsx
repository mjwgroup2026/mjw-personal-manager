import LegalPageLayout from "@/components/LegalPageLayout";

const Security = () => (
  <LegalPageLayout title="Security">
    <p className="text-xs italic">Effective date: 01 March 2026 · Last updated: 01 March 2026</p>

    <p>Ledgera is owned and operated by MJW Business Solutions (Pty) Ltd, Registration Number 2020/924581/07, trading as MJW Group.</p>
    <p>Ledgera takes the security of your financial data seriously. This page outlines the security measures in place to protect your account and information.</p>

    <h2>1. Account Security</h2>
    <ul><li>email and password authentication with secure hashing</li><li>email verification for new accounts</li><li>access approval gating — new accounts require admin review</li><li>secure session management with automatic expiry</li></ul>

    <h2>2. Password Controls</h2>
    <p>We enforce minimum password length requirements. We recommend using a strong, unique password that you do not use for other services. Password reset is available via verified email.</p>

    <h2>3. Access Permissions</h2>
    <ul><li>entity-level isolation — users can only access entities they belong to</li><li>role-based permissions — different capabilities for owners and members</li><li>row-level security at the database level prevents unauthorised data access</li><li>admin functions are restricted to users with the owner role</li></ul>

    <h2>4. Audit Logs</h2>
    <p>All significant actions are recorded in tamper-resistant audit logs. Entity owners can review audit logs to monitor activity and detect any unusual behaviour.</p>

    <h2>5. Document Security</h2>
    <p>Uploaded documents are stored in private storage buckets with access controlled by signed URLs. Documents are never publicly accessible.</p>

    <h2>6. Data Transmission</h2>
    <p>All data in transit is encrypted using TLS. API communications between the platform and backend services are secured and authenticated.</p>

    <h2>7. Period Locks and Record Integrity</h2>
    <p>The platform supports period locking to prevent modifications to finalised accounting periods. Financial edits are versioned with mandatory edit reasons to maintain a complete audit trail.</p>

    <h2>8. Deletion and Data Lifecycle</h2>
    <p>Account deletion is available in-app and through a web request. Deletion requests are logged and processed according to our Data Policy. Certain records may be retained where required by law.</p>

    <h2>9. Recommendations for Users</h2>
    <ul><li>use a strong, unique password</li><li>do not share your login credentials</li><li>log out when using shared or public devices</li><li>regularly review your audit log for unexpected activity</li><li>keep your browser and device software up to date</li><li>be cautious of phishing attempts</li><li>export and securely store records you need to retain</li></ul>

    <h2>10. Reporting Security Concerns</h2>
    <p>If you suspect any security issue with your account or the platform, please contact us immediately.</p>
    <p>
      <strong>Ledgera / MJW Group</strong><br />
      Email: <a href="mailto:ledgera@mjwgroup.co.za" className="underline">ledgera@mjwgroup.co.za</a><br />
      Website: <a href="https://www.mjwgroup.co.za" target="_blank" rel="noopener noreferrer" className="underline">www.mjwgroup.co.za</a><br />
      Address: River Road, Sonkring, Cape Town, 7560, South Africa<br />
      Tel: 021 180 4244
    </p>
  </LegalPageLayout>
);

export default Security;
