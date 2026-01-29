import StaticPage from '../components/StaticPage';

const fallbackContent = `
<h2>Finding Your Perfect Home Made Easy</h2>
<p>RentStay simplifies the entire rental process from search to move-in. Here's how it works:</p>

<h2>Step 1: Search Properties</h2>
<p>Browse our collection of verified rental properties. Use filters to narrow down by:</p>
<ul>
  <li>Location (State, LGA, neighborhood)</li>
  <li>Property type (apartment, self-contain, flat, duplex)</li>
  <li>Price range</li>
  <li>Number of bedrooms</li>
  <li>Amenities</li>
</ul>

<h2>Step 2: Contact the Landlord</h2>
<p>Found a property you like? Send a message directly to the landlord through our platform. Schedule a viewing at a convenient time.</p>

<h2>Step 3: Apply for the Property</h2>
<p>Ready to move forward? Submit your application through RentStay. The landlord will review and respond to your application.</p>

<h2>Step 4: Make Secure Payment</h2>
<p>Once approved, pay your rent and refundable caution fee securely through Paystack. Your caution fee immediately starts earning 5% annual interest!</p>

<h2>Step 5: Sign Digital Agreement</h2>
<p>Review and sign your rental agreement digitally. Both you and the landlord receive copies for your records.</p>

<h2>Step 6: Move In!</h2>
<p>Collect your keys and move into your new home. Your RentStay dashboard helps you:</p>
<ul>
  <li>Track rent payments</li>
  <li>Submit maintenance requests</li>
  <li>Communicate with your landlord</li>
  <li>Monitor your caution fee interest</li>
</ul>

<h2>For Landlords</h2>
<p>Listing your property is just as easy:</p>
<ol>
  <li>Create your landlord account</li>
  <li>Add your property details and photos</li>
  <li>Set your rent price</li>
  <li>Receive and review tenant applications</li>
  <li>Manage everything from your dashboard</li>
</ol>

<h2>Ready to Get Started?</h2>
<p><a href="/properties">Browse properties</a> or <a href="/register">create an account</a> today!</p>
`;

const HowItWorks = () => {
  return (
    <StaticPage
      slug="how-it-works"
      fallbackTitle="How It Works"
      fallbackContent={fallbackContent}
    />
  );
};

export default HowItWorks;
