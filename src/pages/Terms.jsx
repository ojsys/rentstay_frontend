import StaticPage from '../components/StaticPage';

const fallbackContent = `
<p><em>Last updated: January 2025</em></p>

<h2>Agreement to Terms</h2>
<p>By accessing or using RentStay's website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

<h2>Description of Services</h2>
<p>RentStay provides an online platform that connects property owners (landlords) with potential tenants. Our services include:</p>
<ul>
  <li>Property listing and search</li>
  <li>Tenant-landlord communication</li>
  <li>Payment processing</li>
  <li>Digital rental agreements</li>
  <li>Maintenance request management</li>
</ul>

<h2>User Accounts</h2>
<h3>Registration</h3>
<p>To use certain features, you must create an account. You agree to:</p>
<ul>
  <li>Provide accurate and complete information</li>
  <li>Maintain the security of your account</li>
  <li>Notify us immediately of any unauthorized access</li>
  <li>Be responsible for all activities under your account</li>
</ul>

<h3>Account Types</h3>
<p>RentStay offers two account types:</p>
<ul>
  <li><strong>Tenant:</strong> For individuals seeking rental properties</li>
  <li><strong>Landlord:</strong> For property owners listing properties for rent</li>
</ul>

<h2>Landlord Obligations</h2>
<p>If you list properties on RentStay, you agree to:</p>
<ul>
  <li>Provide accurate property information and images</li>
  <li>Maintain properties as advertised</li>
  <li>Respond to tenant inquiries in a timely manner</li>
  <li>Comply with all applicable housing laws and regulations</li>
  <li>Honor agreed-upon rental terms</li>
</ul>

<h2>Tenant Obligations</h2>
<p>If you use RentStay to find housing, you agree to:</p>
<ul>
  <li>Provide accurate personal information</li>
  <li>Make timely rent payments</li>
  <li>Maintain the property in good condition</li>
  <li>Comply with rental agreement terms</li>
  <li>Report maintenance issues promptly</li>
</ul>

<h2>Payments and Fees</h2>
<h3>Caution Fee</h3>
<p>Tenants pay a refundable caution fee equal to 10% of annual rent. This fee:</p>
<ul>
  <li>Earns 5% annual interest while active</li>
  <li>Is fully refundable upon lease termination (minus any deductions for damages)</li>
  <li>Is managed securely by RentStay</li>
</ul>

<h3>Payment Processing</h3>
<p>All payments are processed through Paystack. We are not responsible for payment processing errors by third-party providers.</p>

<h2>Prohibited Activities</h2>
<p>Users may not:</p>
<ul>
  <li>Provide false or misleading information</li>
  <li>Engage in fraudulent activities</li>
  <li>Harass other users</li>
  <li>Violate any applicable laws</li>
  <li>Attempt to circumvent platform fees</li>
  <li>Use the platform for unlawful purposes</li>
</ul>

<h2>Dispute Resolution</h2>
<p>In case of disputes between landlords and tenants, RentStay may provide mediation services but is not responsible for resolving disputes. Unresolved disputes should be addressed through appropriate legal channels.</p>

<h2>Limitation of Liability</h2>
<p>RentStay is a platform connecting users and is not a party to rental agreements. We are not liable for:</p>
<ul>
  <li>Property conditions or misrepresentations</li>
  <li>Actions of landlords or tenants</li>
  <li>Loss or damage arising from property rentals</li>
  <li>Third-party service failures</li>
</ul>

<h2>Intellectual Property</h2>
<p>All content on RentStay, including logos, text, and graphics, is our property and protected by intellectual property laws.</p>

<h2>Termination</h2>
<p>We may suspend or terminate your account for violations of these terms. You may close your account at any time by contacting us.</p>

<h2>Changes to Terms</h2>
<p>We may update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.</p>

<h2>Governing Law</h2>
<p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

<h2>Contact Us</h2>
<p>For questions about these Terms of Service, contact us at:</p>
<ul>
  <li>Email: <a href="mailto:legal@myrentstay.com">legal@myrentstay.com</a></li>
  <li>Address: Jos, Plateau State, Nigeria</li>
</ul>
`;

const Terms = () => {
  return (
    <StaticPage
      slug="terms"
      fallbackTitle="Terms of Service"
      fallbackContent={fallbackContent}
    />
  );
};

export default Terms;
