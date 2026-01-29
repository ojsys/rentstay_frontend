import StaticPage from '../components/StaticPage';

const fallbackContent = `
<h2>Simple, Transparent Pricing</h2>
<p>At RentStay, we believe in transparent pricing with no hidden fees. Here's how our pricing works for both tenants and landlords.</p>

<h2>For Tenants</h2>
<p>Finding your next home on RentStay is completely <strong>free</strong>. You only pay:</p>
<ul>
  <li><strong>Rent:</strong> The agreed monthly or annual rent amount</li>
  <li><strong>Caution Fee:</strong> A refundable 10% of annual rent (earns 5% interest!)</li>
</ul>
<p>That's it! No agent fees, no hidden charges.</p>

<h2>For Landlords</h2>
<p>List your properties and reach thousands of verified tenants:</p>
<ul>
  <li><strong>Basic Listing:</strong> Free - List up to 3 properties</li>
  <li><strong>Premium Listing:</strong> Featured placement and priority support</li>
  <li><strong>Enterprise:</strong> Unlimited listings with dedicated account manager</li>
</ul>

<h2>The Caution Fee Advantage</h2>
<p>Unlike traditional deposits that sit idle with landlords, RentStay's caution fee system benefits everyone:</p>
<ul>
  <li>Tenants earn 5% annual interest on their caution fee</li>
  <li>Landlords have guaranteed protection against damages</li>
  <li>All funds are securely managed and fully refundable</li>
</ul>

<h2>Payment Methods</h2>
<p>We accept multiple payment options through our secure Paystack integration:</p>
<ul>
  <li>Bank Transfer</li>
  <li>Debit/Credit Cards</li>
  <li>USSD Banking</li>
</ul>

<h2>Questions?</h2>
<p>Contact our team at <a href="mailto:support@myrentstay.com">support@myrentstay.com</a> for any pricing inquiries.</p>
`;

const Pricing = () => {
  return (
    <StaticPage
      slug="pricing"
      fallbackTitle="Pricing"
      fallbackContent={fallbackContent}
    />
  );
};

export default Pricing;
