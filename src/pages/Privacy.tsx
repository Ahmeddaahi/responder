import { Card } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { Shield, Lock, Eye, FileText, Globe } from "lucide-react";

const Privacy = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Card className="p-6 sm:p-8 mb-6 bg-gradient-card border-border">
            <div className="prose prose-sm sm:prose-base max-w-none">
              <p className="text-muted-foreground mb-6">
                At Resbonder, we are committed to protecting your privacy and ensuring the security of your personal information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                AI-powered business chat platform.
              </p>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Information We Collect</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Account Information</h3>
                    <p>When you create an account, we collect:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Email address</li>
                      <li>Name (if provided via OAuth authentication)</li>
                      <li>Profile information from Google or Facebook (when using OAuth login)</li>
                      <li>Subscription plan information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Business Information</h3>
                    <p>To provide our services, we collect:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Credentials for WhatsApp integration</li>
                      <li>Business knowledge base data (text information and product details)</li>
                      <li>Phone numbers and contact information for WhatsApp Business API</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Communication Data</h3>
                    <p>We process messages sent through your bots:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Messages received from customers via WhatsApp</li>
                      <li>AI-generated responses sent to customers</li>
                      <li>Message logs and conversation history</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Usage Data</h3>
                    <p>We automatically collect:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Message counts and usage statistics</li>
                      <li>Platform access logs</li>
                      <li>Error logs and performance metrics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Provide and maintain our AI chat bot service</li>
                    <li>Process and respond to customer messages on your behalf</li>
                    <li>Train and improve our AI models using your business knowledge base</li>
                    <li>Manage your subscription and enforce message limits</li>
                    <li>Send you service-related communications</li>
                    <li>Detect, prevent, and address technical issues</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>We implement appropriate technical and organizational measures to protect your data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Data encryption in transit and at rest</li>
                    <li>Secure authentication via OAuth providers</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Secure cloud infrastructure provided by Supabase</li>
                  </ul>
                  <p className="mt-4">
                    Your data is stored on secure servers managed by Supabase, which complies with industry-standard
                    security practices and regulations.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Third-Party Services</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>We use the following third-party services that may process your data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Supabase:</strong> Database and authentication services</li>
                    <li><strong>OpenRouter/Google Gemini:</strong> AI model services for generating responses</li>
                    <li><strong>WhatsApp Business API (Meta):</strong> For WhatsApp bot functionality</li>
                    <li><strong>Google OAuth:</strong> For authentication</li>
                    <li><strong>Facebook OAuth:</strong> For authentication</li>
                  </ul>
                  <p className="mt-4">
                    These services have their own privacy policies. We encourage you to review their privacy practices.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Your Rights</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access and review your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Export your data in a portable format</li>
                    <li>Withdraw consent for data processing</li>
                    <li>Opt out of non-essential communications</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us through the contact information provided in your
                    account settings or admin dashboard.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Message Data and Customer Privacy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    When you use our service to respond to customer messages, we process customer data on your behalf.
                    As the data controller, you are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Informing your customers about the use of AI chatbots</li>
                    <li>Obtaining necessary consents for automated messaging</li>
                    <li>Complying with applicable data protection laws (GDPR, CCPA, etc.)</li>
                    <li>Handling customer data requests and privacy inquiries</li>
                  </ul>
                  <p className="mt-4">
                    We act as a data processor and will only process customer messages in accordance with your
                    instructions and this Privacy Policy.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We retain your data for as long as necessary to provide our services:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Account information: Until account deletion</li>
                    <li>Message logs: As configured in your account settings</li>
                    <li>Business knowledge base: Until you delete it</li>
                    <li>Usage statistics: Aggregated and anonymized after 12 months</li>
                  </ul>
                  <p className="mt-4">
                    You can request deletion of your data at any time by contacting us or using the account deletion
                    feature in your settings.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our service is not intended for individuals under the age of 18. We do not knowingly collect
                  personal information from children. If you believe we have collected information from a child,
                  please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                  the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review
                  this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong> Available through your account settings or admin dashboard<br />
                    <strong>Service:</strong> Resbonder - AI Business Chat Platform
                  </p>
                </div>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Privacy;

