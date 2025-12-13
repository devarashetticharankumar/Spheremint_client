import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
            <SEO title="Terms of Service" description="Terms of Service for SphereMint" />
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-gray-500 text-sm">Last updated: December 12, 2024</p>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">1. Acceptance of Terms</h2>
                    <p className="text-gray-600 leading-relaxed">
                        By accessing or using SphereMint, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">2. User Content</h2>
                    <p className="text-gray-600 leading-relaxed">
                        You retain all rights to any content you submit, post or display on or through SphereMint. By submitting, posting or displaying content on or through SphereMint, you grant us a worldwide, non-exclusive, royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any and all media or distribution methods.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">3. Content Standards</h2>
                    <p className="text-gray-600 leading-relaxed">
                        These content standards apply to any and all material which you contribute to our site. Contributions must:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        <li>Be accurate (where they state facts).</li>
                        <li>Be genuinely held (where they state opinions).</li>
                        <li>Comply with applicable law in the UK and in any country from which they are posted.</li>
                    </ul>
                    <p className="text-gray-600 leading-relaxed mt-2">
                        Contributions must not:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        <li>Contain any material which is defamatory of any person.</li>
                        <li>Contain any material which is obscene, offensive, hateful or inflammatory.</li>
                        <li>Promote sexually explicit material or violence.</li>
                        <li>Promote discrimination based on race, sex, religion, nationality, disability, sexual orientation or age.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800">4. Account Termination</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100">
                    <Link to="/" className="text-[#0ea5e9] hover:underline">Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
