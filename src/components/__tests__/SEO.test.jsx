import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import SEO from '../SEO';

describe('SEO Component', () => {
    it('renders title and meta description correctly', async () => {
        const context = {};
        render(
            <HelmetProvider context={context}>
                <SEO title="Test Title" description="Test Description" />
            </HelmetProvider>
        );

        await waitFor(() => {
            expect(document.title).toBe('Test Title | SphereMint');
            const metaDesc = document.querySelector('meta[name="description"]');
            expect(metaDesc).toHaveAttribute('content', 'Test Description');
        });
    });

    it('uses default values when props are missing', async () => {
        const context = {};
        render(
            <HelmetProvider context={context}>
                <SEO />
            </HelmetProvider>
        );

        await waitFor(() => {
            expect(document.title).toBe('SphereMint - Connect, Share, Discover');
        });
    });
});
