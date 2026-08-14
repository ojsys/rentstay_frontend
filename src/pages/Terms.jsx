import StaticPage from '../components/StaticPage';

// Shown only if the API is unreachable — the published page in
// Core → Static Pages is authoritative. Kept in step with
// backend/core/migrations/0014_terms_shortstay.py.
const fallbackContent = `
<p><em>Last updated: August 2026</em></p>

<h2>1. Agreement to these Terms</h2>
<p>These Terms of Service govern your use of RentStay. By creating an account, listing a
property, booking a stay or renting a home through RentStay, you agree to be bound by them.
If you do not agree, please do not use the platform.</p>

<h2>2. What RentStay does</h2>
<p>RentStay is one platform for renting, ShortStays and property management. We provide:</p>
<ul>
  <li><strong>Long-term rentals</strong> — listing, searching, applications, digital tenancy
      agreements, rent collection and caution-fee management;</li>
  <li><strong>ShortStays</strong> — nightly and short-period bookings of furnished
      accommodation, including availability calendars, instant booking and payments;</li>
  <li><strong>Property management</strong> — tenant records, maintenance requests, payouts,
      reporting, legal notices and calendar synchronisation with other platforms.</li>
</ul>
<p>RentStay is a marketplace and technology provider. Except where expressly stated, we are
not a party to the agreement between a landlord and a tenant, or between a host and a guest.
We do not own, manage, inspect or control any property listed on the platform.</p>

<h2>3. Accounts</h2>
<h3>3.1 Registration</h3>
<p>You must provide accurate and complete information, keep your login credentials secure,
tell us immediately of any unauthorised access, and accept responsibility for activity under
your account. You must be at least 18 years old.</p>

<h3>3.2 Account types</h3>
<ul>
  <li><strong>Tenant</strong> — rents a property for a fixed term under a tenancy agreement.</li>
  <li><strong>Guest</strong> — books ShortStays only. A guest account carries no tenancy and
      no rent obligations.</li>
  <li><strong>Landlord / Host</strong> — lists property for long-term rent, for ShortStay, or
      both.</li>
  <li><strong>Agent</strong> — lists and manages property on behalf of landlords, on agreed
      commission terms.</li>
</ul>
<p>An account may be held by an <strong>individual</strong> or by a <strong>corporate
entity</strong>. Corporate accounts are subject to the additional requirements in clause 4.2.</p>

<h3>3.3 Changing role</h3>
<p>A guest who subsequently takes a tenancy becomes a tenant on the platform, and the
obligations applying to tenants then apply to them.</p>

<h2>4. Verification</h2>
<h3>4.1 Individuals</h3>
<p>Identity verification requires a government-issued identity document and a photograph of
you holding it. We may decline or revoke verification at our discretion.</p>

<h3>4.2 Corporate entities</h3>
<p>A company must additionally provide its registered name, its CAC registration number
(RC or BN), its Tax Identification Number (TIN), its certificate of incorporation, and the
details and identification of at least one director, officer or authorised signatory
empowered to act for it. A VAT registration number and a board resolution or authority
letter may also be required. A company cannot itself execute an agreement; the named
representative does so on its behalf and warrants that they are authorised to do so.</p>

<h3>4.3 Guest verification for ShortStays</h3>
<p>A host may require that guests are verified. Where a host has set that requirement, a
guest may still book and pay before completing verification, and will be reminded to
complete it before check-in. Failure to verify may entitle the host to decline check-in, and
in that event the host's cancellation policy applies.</p>

<h2>5. ShortStays</h2>
<h3>5.1 Booking and confirmation</h3>
<p>A guest requests dates for a listing. Where the host has enabled instant booking, the
booking proceeds directly to payment; otherwise it is a request the host may approve or
decline. A booking is <strong>confirmed only when payment has been received</strong>. Until
then, the dates are not held for you.</p>

<h3>5.2 What a guest pays</h3>
<p>A guest pays the nightly rate multiplied by the number of nights, plus the cleaning fee
where the host has set one. <strong>RentStay charges guests no separate service or booking
fee.</strong> The total shown before you pay is the total you pay.</p>

<h3>5.3 Host fees, and the first three bookings</h3>
<p>RentStay charges the <strong>host</strong> a commission of <strong>10%</strong> of the
accommodation subtotal on each confirmed booking. The commission is deducted from the host's
payout and is never added to the guest's price. The cleaning fee is not commissioned and is
passed to the host in full.</p>
<p><strong>New hosts pay no commission on their first three confirmed bookings.</strong>
This allowance:</p>
<ul>
  <li>applies per host, counted across all of that host's listings — not per listing;</li>
  <li>is consumed only by a booking that is actually confirmed. If such a booking is later
      cancelled or falls through, the allowance is restored;</li>
  <li>carries no time limit and no cash value, and cannot be transferred or redeemed.</li>
</ul>
<p>The commission rate and the number of free bookings are set by RentStay and may be varied
on notice. Any change applies only to bookings confirmed after the change takes effect; the
rate applying to a booking is fixed when that booking is made.</p>

<h3>5.4 Payouts</h3>
<p>Host earnings become available for withdrawal after the guest's stay has been paid for,
net of commission. Payouts are made to the bank account registered by the host, and we may
withhold a payout where a booking is disputed, where a refund is pending, or where we
reasonably suspect fraud.</p>

<h3>5.5 Cancellation and refunds</h3>
<p>Each listing displays one of the following policies, chosen by the host, which determines
what a cancelling guest is entitled to:</p>
<ul>
  <li><strong>Flexible</strong> — full refund if cancelled more than 24 hours before check-in;</li>
  <li><strong>Moderate</strong> — full refund if cancelled more than 5 days before check-in;</li>
  <li><strong>Strict</strong> — 50% of the accommodation refunded if cancelled more than
      7 days before check-in.</li>
</ul>
<p>Where any refund is due, the cleaning fee is refunded in full, as no cleaning has been
performed. Cancelling inside the applicable window carries no automatic entitlement.</p>
<p>Cancelling a paid booking raises a <strong>refund request</strong>. The host reviews it
and may approve the amount the policy provides, approve a different amount as a goodwill
gesture, or decline. Approved refunds are returned to the original payment method. The
policy applying to a booking is fixed at the time of booking; a host changing their listing's
policy afterwards does not affect bookings already made.</p>
<p>A host who cancels a confirmed booking must refund the guest in full. Repeated host
cancellations may result in suspension of the listing or the account.</p>

<h3>5.6 The stay itself</h3>
<p>Guests must observe the host's house rules, occupancy limits, and check-in and check-out
times, and must leave the property in a reasonable condition. Hosts must provide the
accommodation as described and materially as photographed, and must make it available and
habitable for the booked dates. Guests are responsible for damage they or their party cause
beyond fair wear and tear.</p>

<h3>5.7 Calendar synchronisation</h3>
<p>Hosts may connect calendars from other platforms so that dates booked elsewhere are
blocked on RentStay. Synchronisation depends on those third-party services and is not
instantaneous. <strong>Hosts remain responsible for their own availability</strong>, and
RentStay is not liable for a double booking arising from a delayed, failed or misconfigured
calendar feed.</p>

<h3>5.8 Reviews</h3>
<p>After a completed stay, guests and hosts may review each other. Reviews must be honest
and based on genuine experience. We may remove reviews that are abusive, defamatory,
irrelevant, or offered or solicited in exchange for anything of value.</p>

<h2>6. Long-term rentals</h2>
<h3>6.1 Agreements</h3>
<p>A tenancy is between the landlord and the tenant. RentStay provides templates and digital
execution as a convenience. Templates are not legal advice, and the parties are responsible
for the terms they agree.</p>

<h3>6.2 Caution fee</h3>
<p>Where a caution fee is paid through RentStay, it is held as a refundable deposit, may earn
interest at the published rate, and is refundable at the end of the tenancy subject to lawful
deductions for unpaid rent, utilities, damage beyond fair wear and tear, or cleaning. Any
deduction must be itemised.</p>

<h3>6.3 Rent payments</h3>
<p>Rent paid through RentStay may carry a platform commission, disclosed before payment. The
landlord receives the rent due under the tenancy agreement.</p>

<h3>6.4 Notices</h3>
<p>RentStay allows landlords to prepare, serve and record legal notices. RentStay records and
delivers what the landlord writes. <strong>We do not verify that a notice is legally
sufficient</strong>, and notice periods and formal requirements vary between states. Serving
a notice through the platform is not a substitute for legal advice.</p>

<h2>7. Payments</h2>
<p>Payments are processed by our payment provider. We do not store full card details. You
warrant that you are authorised to use the payment method you provide. A receipt is issued
for every successful payment and is available from your booking or payment records.</p>
<p>Where a payment succeeds with the provider but is not reflected on the platform, the
booking can be reconciled from your booking page or by contacting support. Your rights are
determined by the payment actually received, not by a display error.</p>

<h2>8. Legal support services</h2>
<p>Where RentStay offers legal support, it coordinates and records your case and may refer it
to a partner firm. <strong>RentStay is not a law firm</strong>, and using the service does not
create a solicitor–client relationship with RentStay. Guidance provided is general unless a
partner firm expressly advises you.</p>

<h2>9. Acceptable use</h2>
<p>You must not: list a property you have no right to let; misrepresent a property, its
location, price or availability; take payment or communicate off-platform to avoid fees;
discriminate unlawfully against any person; harass any user; upload unlawful content; or
attempt to disrupt, probe or reverse-engineer the platform.</p>

<h2>10. Suspension and termination</h2>
<p>We may suspend or terminate an account that breaches these Terms, that we reasonably
believe is being used fraudulently, or where required by law. Where possible we will give
notice and a chance to respond. Termination does not affect bookings or tenancies already in
effect, or sums already owed.</p>

<h2>11. Disclaimers and liability</h2>
<p>The platform is provided "as is". We do not warrant uninterrupted or error-free service.
We do not inspect properties and we do not guarantee the accuracy of user-supplied listings,
the conduct of any user, or the condition of any property. To the fullest extent permitted by
law, RentStay is not liable for indirect or consequential loss, and our total liability in
connection with any booking or tenancy is limited to the fees we received in respect of it.</p>
<p>Nothing in these Terms excludes liability that cannot lawfully be excluded.</p>

<h2>12. Disputes</h2>
<p>Report a dispute to us promptly. We may assist with information and records held on the
platform, but a dispute between a landlord and tenant, or a host and guest, remains between
those parties. We will first attempt an amicable resolution; failing that, the courts having
jurisdiction over the property may be approached.</p>

<h2>13. Data protection</h2>
<p>We handle personal data in accordance with our Privacy Policy and the Nigeria Data
Protection Act. Identity and company documents are used for verification and are not shared
with other users; a counterparty sees only whether an account is verified.</p>

<h2>14. Changes to these Terms</h2>
<p>We may update these Terms. Material changes will be notified through the platform. Changes
take effect from the date published, and bookings or tenancies already confirmed continue on
the terms in force when they were made.</p>

<h2>15. Governing law</h2>
<p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>

<h2>16. Contact</h2>
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
