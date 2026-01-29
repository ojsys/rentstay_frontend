import StaticPage from '../components/StaticPage';

const fallbackContent = `
<p><em>Last updated: January 2025</em></p>

<h2>Introduction</h2>
<p>RentStay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>

<h2>Information We Collect</h2>
<h3>Personal Information</h3>
<p>We may collect personal information that you provide directly to us, including:</p>
<ul>
  <li>Name, email address, and phone number</li>
  <li>Account credentials</li>
  <li>Profile information (photo, bio, preferences)</li>
  <li>Payment information (processed securely through Paystack)</li>
  <li>Property details (for landlords)</li>
  <li>Communication records</li>
</ul>

<h3>Automatically Collected Information</h3>
<p>When you use our services, we may automatically collect:</p>
<ul>
  <li>Device information (browser type, operating system)</li>
  <li>IP address and location data</li>
  <li>Usage data and browsing history on our platform</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide and maintain our services</li>
  <li>Process transactions and payments</li>
  <li>Connect tenants with landlords</li>
  <li>Send you important updates and notifications</li>
  <li>Improve our platform and user experience</li>
  <li>Ensure security and prevent fraud</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>Information Sharing</h2>
<p>We may share your information with:</p>
<ul>
  <li><strong>Other Users:</strong> To facilitate property rentals (e.g., landlords see tenant applications)</li>
  <li><strong>Service Providers:</strong> Third parties that help us operate our platform (e.g., Paystack for payments)</li>
  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
</ul>
<p>We never sell your personal information to third parties.</p>

<h2>Data Security</h2>
<p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Correct inaccurate information</li>
  <li>Delete your account and associated data</li>
  <li>Opt out of marketing communications</li>
</ul>

<h2>Cookies</h2>
<p>We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookies through your browser settings.</p>

<h2>Children's Privacy</h2>
<p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from children.</p>

<h2>Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us at:</p>
<ul>
  <li>Email: <a href="mailto:privacy@myrentstay.com">privacy@myrentstay.com</a></li>
  <li>Address: Jos, Plateau State, Nigeria</li>
</ul>
`;

const Privacy = () => {
  return (
    <StaticPage
      slug="privacy"
      fallbackTitle="Privacy Policy"
      fallbackContent={fallbackContent}
    />
  );
};

export default Privacy;
