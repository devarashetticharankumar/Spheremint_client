import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PrivacyPolicy from '../../pages/PrivacyPolicy';
import TermsOfService from '../../pages/TermsOfService';
import About from '../../pages/About';
import Contact from '../../pages/Contact';

// Helper to render with Router and Helmet
const renderWithProviders = (ui) => {
    return render(
        <HelmetProvider>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </HelmetProvider>
    );
};

describe('Legal & Info Pages', () => {
    it('renders Privacy Policy page', () => {
        renderWithProviders(<PrivacyPolicy />);
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
        expect(screen.getByText(/Data We Collect/i)).toBeInTheDocument();
    });

    it('renders Terms of Service page', () => {
        renderWithProviders(<TermsOfService />);
        expect(screen.getByText('Terms of Service')).toBeInTheDocument();
        expect(screen.getByText(/Acceptance of Terms/i)).toBeInTheDocument();
    });

    it('renders About Us page', () => {
        renderWithProviders(<About />);
        expect(screen.getByText(/About SphereMint/i)).toBeInTheDocument();
        expect(screen.getByText(/Our Mission/i)).toBeInTheDocument();
    });

    it('renders Contact Us page', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });
});
