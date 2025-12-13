import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
            <SEO title="Contact Us" description="Contact SphereMint" />
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Get in Touch</h2>
                        <p className="text-gray-600">
                            We'd love to hear from you. Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <Mail className="text-[#0ea5e9]" />
                                <span>support@spheremint.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Phone className="text-[#0ea5e9]" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <MapPin className="text-[#0ea5e9]" />
                                <span>123 Social Way, Tech City, TC 94043</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] outline-none" placeholder="Your Name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] outline-none" placeholder="your@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] outline-none resize-none h-32" placeholder="How can we help?"></textarea>
                            </div>
                            <button className="w-full bg-[#0ea5e9] text-white py-2 rounded-lg font-bold hover:bg-[#0284c7] transition">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 mt-8 border-t border-gray-100 text-center">
                    <Link to="/" className="text-[#0ea5e9] hover:underline">Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
