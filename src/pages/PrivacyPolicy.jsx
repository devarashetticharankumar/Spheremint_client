import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
            <SEO title="Privacy Policy" description="Privacy Policy for SphereMint" />
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-500 text-sm">Last updated: December 12, 2024</p>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Welcome to SphereMint. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">2. Data We Collect</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        <li><strong>Identity Data:</strong> includes name, username, and profile picture.</li>
                        <li><strong>Contact Data:</strong> includes email address.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">3. How We Use Your Data</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        <li>To register you as a new customer.</li>
                        <li>To provide and improve our services.</li>
                        <li>To manage our relationship with you.</li>
                        <li>To enable you to partake in interactive features (posts, chats).</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">4. Cookies</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We use cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">5. Contact Us</h2>
                    <p className="text-gray-600 leading-relaxed">
                        If you have any questions about this privacy policy or our privacy practices, please contact us at: privacy@spheremint.com
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100">
                    <Link to="/" className="text-[#0ea5e9] hover:underline">Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
