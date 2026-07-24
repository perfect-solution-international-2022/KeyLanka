import Link from "next/link";

export function TermsContent() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: 23 July 2026</p>

      <div className="space-y-3 text-gray-600 leading-relaxed">
        <p>
          Welcome to KeyLanka.lk. By accessing this website or placing an order, you agree to these Terms and
          Conditions.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">1. About KeyLanka.lk</h2>
        <p>KeyLanka.lk is an online store specialising in automotive key solutions, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Car Remote Keys</li>
          <li>Smart Keys</li>
          <li>Flip Keys</li>
          <li>Key Shells</li>
          <li>Transponder Chips</li>
          <li>Key Blades</li>
          <li>Remote Key Accessories</li>
          <li>Locksmith Tools</li>
          <li>Key Programming Equipment</li>
          <li>Diagnostic Devices</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">2. Eligibility</h2>
        <p>
          You must be at least 18 years old or have the permission of a parent or legal guardian to place an order
          through this website.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">3. Orders</h2>
        <p>All orders are subject to acceptance and product availability.</p>
        <p>KeyLanka.lk reserves the right to refuse, cancel or limit any order at its sole discretion.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">4. Pricing</h2>
        <p>All prices displayed on our website are in Sri Lankan Rupees (LKR) unless otherwise stated.</p>
        <p>Prices and product availability may change without prior notice.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">5. Payments</h2>
        <p>
          Orders will be processed only after payment has been successfully confirmed unless Cash on Delivery is
          available.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">6. Product Information</h2>
        <p>We make every effort to ensure that product descriptions, specifications and images are accurate.</p>
        <p>However, product colours, packaging and appearance may vary slightly from the images shown.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">7. Vehicle Compatibility</h2>
        <p>
          Customers are responsible for ensuring that the selected product is compatible with their vehicle before
          placing an order.
        </p>
        <p>If you are unsure, please contact us with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Vehicle Make</li>
          <li>Vehicle Model</li>
          <li>Year of Manufacture</li>
          <li>Photos of your existing key</li>
          <li>Part Number (if available)</li>
        </ul>
        <p>We will assist you based on the information provided by you.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">8. Programming &amp; Key Cutting</h2>
        <p>Unless otherwise stated, all keys are supplied uncut and unprogrammed.</p>
        <p>Programming, coding, pairing and key cutting services are not included in the product price.</p>
        <p>Professional installation or programming may be required.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">
          9. KeyLanka Locksmith Merchant Program &amp; Restricted Products
        </h2>
        <p>
          Certain products available on KeyLanka.lk, including locksmith tools, key programmers, EEPROM tools,
          diagnostic equipment and other security-related products, are classified as Restricted Products.
        </p>
        <p>
          These products are available only to registered KeyLanka Locksmith Merchants and are not available for
          sale to the general public.
        </p>
        <p>To purchase Restricted Products, customers must first apply and be approved as a KeyLanka Locksmith Merchant.</p>
        <p>As part of the approval process, KeyLanka.lk may request documents such as:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Business Registration Certificate</li>
          <li>National Identity Card or Passport</li>
          <li>Business Address</li>
          <li>Company Information</li>
          <li>Other supporting documents where required</li>
        </ul>
        <p>Submitting an application does not guarantee approval.</p>
        <p>
          KeyLanka.lk reserves the right to approve, reject, suspend or terminate any Locksmith Merchant account at
          its sole discretion.
        </p>
        <p>
          Orders placed for Restricted Products by customers who are not approved KeyLanka Locksmith Merchants may
          be cancelled without prior notice.
        </p>
        <p>All Restricted Products are supplied strictly for lawful and professional use only.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">10. Shipping &amp; Delivery</h2>
        <p>Orders will be dispatched after payment confirmation.</p>
        <p>
          Delivery times are estimates only and may vary depending on your location, courier services and public
          holidays.
        </p>
        <p>
          KeyLanka.lk is not responsible for delays caused by courier companies or circumstances beyond our
          control.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">11. Warranty</h2>
        <p>Warranty applies only to verified manufacturing defects.</p>
        <p>Warranty does not cover:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Incorrect programming</li>
          <li>Incorrect installation</li>
          <li>Water damage</li>
          <li>Physical or accidental damage</li>
          <li>Battery failure</li>
          <li>Normal wear and tear</li>
          <li>Misuse or modification</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">12. No Return &amp; No Refund</h2>
        <p>Due to the nature of automotive security products, all sales are final.</p>
        <p>
          Please refer to our{" "}
          <Link href="/refund-policy" className="text-brand hover:underline">
            No Return &amp; No Refund Policy
          </Link>{" "}
          for complete details.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">13. Customer Responsibilities</h2>
        <p>Customers agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate personal and delivery information.</li>
          <li>Verify vehicle compatibility before purchasing.</li>
          <li>Use products only for lawful purposes.</li>
          <li>Follow the manufacturer&apos;s installation and programming instructions.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">14. Prohibited Use</h2>
        <p>Products purchased from KeyLanka.lk must not be used for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Vehicle theft</li>
          <li>Unauthorised vehicle access</li>
          <li>Illegal duplication of vehicle keys</li>
          <li>Any unlawful activity</li>
        </ul>
        <p>KeyLanka.lk reserves the right to refuse service where unlawful activity is suspected.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">15. Intellectual Property</h2>
        <p>
          All content on KeyLanka.lk, including logos, images, graphics, product descriptions and website design,
          is the property of KeyLanka.lk and may not be copied or reproduced without prior written permission.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">16. Limitation of Liability</h2>
        <p>KeyLanka.lk shall not be liable for any indirect, incidental or consequential loss arising from:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Incorrect product selection</li>
          <li>Incorrect vehicle information provided by the customer</li>
          <li>Failed programming</li>
          <li>Incorrect installation</li>
          <li>Vehicle immobilisation</li>
          <li>Loss of business or profits</li>
        </ul>
        <p>Our maximum liability shall not exceed the purchase price paid for the product.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">17. Privacy</h2>
        <p>
          Your personal information is collected and processed in accordance with our{" "}
          <Link href="/privacy-policy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">18. Changes to These Terms</h2>
        <p>We reserve the right to modify these Terms and Conditions at any time.</p>
        <p>The latest version will always be available on KeyLanka.lk.</p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">19. Governing Law</h2>
        <p>
          These Terms and Conditions shall be governed by the laws of the Democratic Socialist Republic of Sri
          Lanka.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-5">20. Contact Us</h2>
        <p className="font-semibold text-gray-900">KeyLanka.lk</p>
        <p>
          Website:{" "}
          <a href="https://www.keylanka.lk" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
            www.keylanka.lk
          </a>
        </p>
        <p>Email: info@keylanka.lk</p>
      </div>
    </>
  );
}
