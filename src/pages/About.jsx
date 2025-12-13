import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function About() {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
            <SEO title="About Us" description="About SphereMint" />
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm space-y-6 text-center">
                <h1 className="text-4xl font-bold text-[#0ea5e9] mb-4">About SphereMint</h1>

                <p className="text-xl text-gray-600 font-medium max-w-xl mx-auto">
                    Connecting people through moments, shared passions, and meaningful conversations.
                </p>

                <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="p-6 bg-blue-50 rounded-xl">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Connect</h3>
                        <p className="text-blue-700 text-sm">Find new friends nearby or across the globe who share your interests.</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-xl">
                        <h3 className="text-lg font-bold text-emerald-900 mb-2">Share</h3>
                        <p className="text-emerald-700 text-sm">Share your life's moments through posts, photos, and voice notes securely.</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-xl">
                        <h3 className="text-lg font-bold text-purple-900 mb-2">Discover</h3>
                        <p className="text-purple-700 text-sm">Explore trending topics, join chat rooms, and participate in topic battles.</p>
                    </div>
                </div>

                <div className="text-left space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed">
                        SphereMint was built with the belief that social media should be about genuine connection, not just mindless scrolling. We strive to create a safe, engaging, and innovative platform where users can express themselves freely while maintaining control over their privacy.
                    </p>
                </div>

                <div className="pt-8 text-center">
                    <Link to="/" className="inline-block px-6 py-3 bg-[#0ea5e9] text-white font-bold rounded-xl hover:bg-[#0284c7] transition">
                        Join the Community
                    </Link>
                </div>
            </div>
        </div>
    );
}
