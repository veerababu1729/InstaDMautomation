export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ maxWidth: 800, padding: '60px 20px', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--text-primary)' }}>
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>1. Information We Collect</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            This application is designed to automate Instagram Direct Messages. To function, it processes public Instagram comments and sends automated direct messages. We do not store personal conversations or harvest user data beyond what is strictly necessary to trigger the automated response.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Data received from the Meta Graph API (such as Instagram User IDs and comment text) is used exclusively to determine if an automated reply should be sent and to deliver that reply. 
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>3. Data Sharing</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. 
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>4. Contact Us</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            If you have any questions regarding this privacy policy, you may contact the page owner directly on Instagram.
          </p>
        </section>
      </div>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <a href="/" style={{ color: 'var(--accent-purple)' }}>← Back to Home</a>
      </div>
    </div>
  );
}
