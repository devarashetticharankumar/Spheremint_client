import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    author,
    siteName = 'SphereMint'
}) => {
    const defaults = {
        title: 'SphereMint - Connect, Share, Discover',
        description: 'SphereMint is a modern social platform for connecting with friends, sharing moments, and discovering new communities.',
        keywords: 'social media, connect, share, moments, community, spheremint',
        image: '/og-image.jpg', // You should create this image in public folder
        url: window.location.href, // Fallback to current URL if not provided
    };

    const meta = {
        title: title ? `${title} | ${siteName}` : defaults.title,
        description: description || defaults.description,
        keywords: keywords || defaults.keywords,
        image: image || defaults.image,
        url: url || defaults.url,
        type: type,
        author: author || 'SphereMint Team',
        siteName: siteName
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{meta.title}</title>
            <meta name="description" content={meta.description} />
            <meta name="keywords" content={meta.keywords} />
            <meta name="author" content={meta.author} />
            <link rel="canonical" href={meta.url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={meta.type} />
            <meta property="og:url" content={meta.url} />
            <meta property="og:title" content={meta.title} />
            <meta property="og:description" content={meta.description} />
            <meta property="og:image" content={meta.image} />
            <meta property="og:site_name" content={meta.siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={meta.url} />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={meta.image} />
        </Helmet>
    );
};

export default SEO;
