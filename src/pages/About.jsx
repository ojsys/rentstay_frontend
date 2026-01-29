import StaticPage from '../components/StaticPage';

const fallbackContent = `
<h2>Our Story</h2>
<p>RentStay is transforming the rental housing experience in Nigeria. We started with a simple mission: to make finding and renting a home transparent, secure, and hassle-free.</p>

<h2>Our Mission</h2>
<p>To provide 360° housing solutions that eliminate the frustration of traditional house hunting. We believe everyone deserves access to verified properties, transparent pricing, and a secure rental process.</p>

<h2>What Makes Us Different</h2>
<ul>
  <li><strong>Verified Listings:</strong> Every property on our platform is verified and agent-free</li>
  <li><strong>Transparent Pricing:</strong> No hidden fees - see rent and refundable caution fees upfront</li>
  <li><strong>Earn Interest:</strong> Your caution fee earns 5% annual interest while you rent</li>
  <li><strong>Digital Agreements:</strong> Sign and manage your rental agreements online</li>
  <li><strong>Easy Communication:</strong> Message landlords directly through our platform</li>
</ul>

<h2>Our Team</h2>
<p>We're a passionate team of real estate professionals and technology experts dedicated to revolutionizing the Nigerian rental market. Based in Jos, Plateau State, we understand the local market and the challenges tenants and landlords face.</p>

<h2>Contact Us</h2>
<p>Have questions? We'd love to hear from you. Reach out to us at <a href="mailto:support@myrentstay.com">support@myrentstay.com</a></p>
`;

const About = () => {
  return (
    <StaticPage
      slug="about"
      fallbackTitle="About Us"
      fallbackContent={fallbackContent}
    />
  );
};

export default About;
