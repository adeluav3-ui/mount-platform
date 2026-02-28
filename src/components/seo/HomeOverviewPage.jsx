// src/components/seo/HomeOverviewPage.jsx - PREMIUM REDESIGN
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';
import ceoImage from '../../assets/CEO.jpg';
import logo from '../../assets/logo.png';

/* ─── Inline styles for animations & custom elements ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --green: #1a7a4a;
    --green-dark: #0f5233;
    --green-light: #e8f5ee;
    --green-mid: #2d9a5f;
    --gold: #c9a84c;
    --off-white: #f9f8f5;
    --ink: #111714;
    --ink-soft: #3d4a42;
    --muted: #8a9990;
  }

  .mount-page * { box-sizing: border-box; }
  .mount-page { font-family: 'DM Sans', sans-serif; background: var(--off-white); }

  .display-font { font-family: 'Playfair Display', serif; }

  /* Fade-in animation */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.75s ease both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.36s; }
  .delay-4 { animation-delay: 0.50s; }

  /* Marquee */
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 28s linear infinite;
  }
  .marquee-track:hover { animation-play-state: paused; }

  /* Nav pill active */
  .nav-link::after {
    content: '';
    display: block;
    height: 2px;
    background: var(--green);
    transform: scaleX(0);
    transition: transform 0.25s ease;
    margin-top: 3px;
    border-radius: 2px;
  }
  .nav-link:hover::after { transform: scaleX(1); }

  /* Service card shimmer */
  .service-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .service-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(26,122,74,0) 0%, rgba(26,122,74,0.06) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .service-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(26,122,74,0.14); }
  .service-card:hover::before { opacity: 1; }

  /* Step card border animation */
  .step-card {
    border: 1.5px solid #e4e9e6;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .step-card:hover {
    border-color: var(--green);
    box-shadow: 0 16px 48px rgba(26,122,74,0.12);
  }

  /* Gold accent line */
  .gold-line {
    display: inline-block;
    width: 48px;
    height: 3px;
    background: var(--gold);
    border-radius: 2px;
  }

  /* CTA button hover */
  .btn-primary {
    background: var(--green);
    color: #fff;
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
  }
  .btn-primary:hover {
    background: var(--green-dark);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(26,122,74,0.35);
  }
  .btn-outline {
    border: 2px solid rgba(255,255,255,0.45);
    color: #fff;
    transition: background 0.25s, border-color 0.25s;
  }
  .btn-outline:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.8);
  }

  /* Hero pattern overlay */
  .hero-pattern {
    background-image:
      radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(201,168,76,0.12) 0%, transparent 40%);
  }
`;

const HomeOverviewPage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started Main', '/home');
        navigate('/app', { state: { from: 'seo-home-overview' } });
    };

    const handleExploreServices = () => {
        trackSEOButtonClick('Explore Services Main', '/home');
        navigate('/services');
    };

    const serviceCategories = [
        { name: 'Electrician', icon: '⚡', slug: 'electrician' },
        { name: 'Plumber', icon: '🔧', slug: 'plumber' },
        { name: 'Cleaning', icon: '🧹', slug: 'cleaning' },
        { name: 'Painting', icon: '🎨', slug: 'painting' },
        { name: 'AC Repair', icon: '❄️', slug: 'ac-repair' },
        { name: 'Carpenter', icon: '🪚', slug: 'carpenter' },
        { name: 'Pest Control', icon: '🐜', slug: 'pest-control' },
        { name: 'Roofing', icon: '🏠', slug: 'roofing' },
        { name: 'Logistics', icon: '🚚', slug: 'logistics' },
        { name: 'Hair Styling', icon: '💇', slug: 'hair-styling' },
    ];

    const navLinks = [
        { name: 'Services', href: '/services' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Customers', href: '/for-customers' },
        { name: 'For Providers', href: '/for-providers' },
        { name: 'Ogun State', href: '/locations/ogun' },
        { name: 'Contact Us', href: '/contact' },
    ];



    return (
        <div className="mount-page min-h-screen">
            <style>{globalStyles}</style>

            <SimpleHelmet
                title="Mount – Nigeria's Trusted Home Services Marketplace"
                description="Book verified electricians, plumbers, cleaners & more in Nigeria. Secure payments, quality guarantees, real-time tracking. Serving Ogun State."
                canonical="/home"
            />

            {/* ── Navigation ── */}
            <nav
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
                    borderBottom: '1px solid #e8ede9',
                    backdropFilter: 'blur(12px)',
                    transition: 'box-shadow 0.3s',
                    boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.07)' : 'none',
                }}
            >
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
                        {/* Logo */}
                        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                            <img src={logo} alt="Mount Logo" style={{ height: '38px', width: 'auto' }} />
                            <span className="display-font" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
                                Mount
                            </span>
                        </a>

                        {/* Desktop Nav */}
                        <div style={{ display: 'none', alignItems: 'center', gap: '2.2rem' }} className="desktop-nav"
                            ref={el => { if (el) { el.style.display = window.innerWidth >= 1024 ? 'flex' : 'none'; } }}>
                            {navLinks.map(link => (
                                <a key={link.name} href={link.href} className="nav-link"
                                    style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-soft)', textDecoration: 'none', letterSpacing: '0.01em' }}>
                                    {link.name}
                                </a>
                            ))}
                            <button onClick={handleGetStartedClick} className="btn-primary"
                                style={{ padding: '0.55rem 1.4rem', borderRadius: '100px', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Toggle */}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div style={{ borderTop: '1px solid #e8ede9', padding: '1rem 0 1.5rem' }}>
                            {navLinks.map(link => (
                                <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)}
                                    style={{ display: 'block', padding: '0.65rem 0', color: 'var(--ink-soft)', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
                                    {link.name}
                                </a>
                            ))}

                            {/* NEW: Mobile Legal Links */}
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e8ede9' }}>
                                <a href="/terms" onClick={() => setIsMenuOpen(false)}
                                    style={{ display: 'block', padding: '0.65rem 0', color: 'var(--ink-soft)', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
                                    📄 Terms of Service
                                </a>
                                <a href="/privacy" onClick={() => setIsMenuOpen(false)}
                                    style={{ display: 'block', padding: '0.65rem 0', color: 'var(--ink-soft)', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
                                    🔒 Privacy & Cookies Policy
                                </a>
                            </div>

                            <button onClick={() => { setIsMenuOpen(false); handleGetStartedClick(); }} className="btn-primary"
                                style={{ marginTop: '0.75rem', width: '100%', padding: '0.75rem', borderRadius: '100px', fontWeight: 600, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="hero-pattern" style={{ background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)', color: '#fff', padding: '5rem 1.5rem 6rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
                        {/* Left */}
                        <div className="fade-up" style={{ maxWidth: '680px' }}>
                            {/* Badge */}
                            <div className="delay-1 fade-up" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '100px', padding: '0.35rem 1rem', marginBottom: '2rem',
                                fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.04em', backdropFilter: 'blur(8px)'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7de8a8', display: 'inline-block' }}></span>
                                Now serving Ogun State, Nigeria
                            </div>

                            <h1 className="display-font delay-2 fade-up" style={{
                                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 700, lineHeight: 1.12,
                                marginBottom: '1.5rem', letterSpacing: '-0.02em'
                            }}>
                                Nigeria's Trusted<br />
                                <span style={{ color: 'var(--gold)' }}>Home Services</span><br />
                                Marketplace
                            </h1>

                            <p className="delay-3 fade-up" style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '520px' }}>
                                Book verified professionals with secure payments, quality guarantees, and real-time tracking — all in one place.
                            </p>

                            <div className="delay-4 fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                <button onClick={handleGetStartedClick}
                                    style={{ background: '#fff', color: 'var(--green)', fontWeight: 700, padding: '0.85rem 2rem', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'transform 0.2s, box-shadow 0.2s', letterSpacing: '0.01em' }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.28)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}>
                                    Book a Service
                                </button>
                                <button onClick={handleExploreServices} className="btn-outline"
                                    style={{ padding: '0.85rem 2rem', borderRadius: '100px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, background: 'transparent', letterSpacing: '0.01em' }}>
                                    Explore Services →
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Marquee Trust Bar ── */}
            <div style={{ background: 'var(--green-dark)', padding: '0.85rem 0', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="marquee-track">
                    {[...Array(3)].flatMap(() => [
                        '✓ Verified Professionals', '✓ Secure Payments', '✓ Real-Time Job Tracking',
                        '✓ Quality Guarantee', '✓ Fast Booking', '✓ Dispute Resolution', '✓ Serving Ogun State',
                    ]).map((text, i) => (
                        <span key={i} style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.05em', padding: '0 2.5rem' }}>
                            {text}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Services Grid ── */}
            <section style={{ padding: '5rem 1.5rem', background: 'var(--off-white)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <span className="gold-line" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }}></span>
                        <h2 className="display-font" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                            Professional Services for Every Need
                        </h2>
                        <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
                            From electrical work to plumbing, cleaning to logistics — find trusted professionals for any home service.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                        {serviceCategories.map((service, i) => (
                            <a key={i} href={`/services/${service.slug}`} className="service-card"
                                style={{
                                    background: '#fff', borderRadius: '16px', padding: '1.75rem 1rem',
                                    textAlign: 'center', textDecoration: 'none',
                                    border: '1.5px solid #e8ede9', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                                }}>
                                <span style={{ fontSize: '2.2rem', display: 'block', lineHeight: 1 }}>{service.icon}</span>
                                <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem', letterSpacing: '0.01em' }}>{service.name}</span>
                            </a>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <a href="/services" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            color: 'var(--green)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem',
                            borderBottom: '2px solid var(--green-light)', paddingBottom: '2px', transition: 'border-color 0.2s'
                        }}>
                            View all services →
                        </a>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section style={{ padding: '5rem 1.5rem', background: '#fff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <span className="gold-line" style={{ display: 'block', margin: '0 auto 1rem' }}></span>
                        <h2 className="display-font" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                            Simple, Secure, Stress-Free
                        </h2>
                        <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto' }}>
                            Our process protects both customers and professionals at every step.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { step: '01', title: 'Post a Job', description: "Describe what you need and set your budget. It's free to post and takes under 2 minutes.", link: '/for-customers', linkText: 'Learn More' },
                            { step: '02', title: 'Secure Payment', description: '50% deposit is held securely in our account. Pay the balance only when you\'re satisfied.', link: '/how-it-works', linkText: 'How It Works' },
                            { step: '03', title: 'Quality Guaranteed', description: 'Verified professionals with verified reviews. We mediate any dispute fairly and quickly.', link: '/for-providers', linkText: 'For Providers' },
                        ].map((item, i) => (
                            <div key={i} className="step-card"
                                style={{ background: '#fff', borderRadius: '20px', padding: '2.25rem', position: 'relative', overflow: 'hidden' }}>
                                <div className="display-font" style={{
                                    position: 'absolute', top: '1.5rem', right: '1.75rem',
                                    fontSize: '4rem', fontWeight: 700, color: 'var(--green-light)', lineHeight: 1, userSelect: 'none'
                                }}>
                                    {item.step}
                                </div>
                                <div style={{ width: '44px', height: '44px', background: 'var(--green-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.9rem' }}>{item.step}</span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>{item.title}</h3>
                                <p style={{ color: 'var(--ink-soft)', lineHeight: 1.65, fontSize: '0.95rem', marginBottom: '1.5rem' }}>{item.description}</p>
                                <a href={item.link} style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {item.linkText} →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About & CEO ── */}
            <section style={{ padding: '5rem 1.5rem', background: '#fff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    {/* Text */}
                    <div>
                        <span className="gold-line" style={{ display: 'block', marginBottom: '1.5rem' }}></span>
                        <h2 className="display-font" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            Building Trust in Nigeria's Home Services Industry
                        </h2>
                        <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem', lineHeight: 1.75, fontSize: '0.97rem' }}>
                            We're transforming how Nigerians find and book home services — creating a trusted marketplace where quality meets convenience, and every transaction is secure.
                        </p>
                        <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.97rem' }}>
                            By solving the challenges of finding reliable professionals, ensuring fair pricing, and guaranteeing quality work through our secure platform.
                        </p>

                        <div style={{ background: 'var(--green-light)', borderRadius: '16px', padding: '1.5rem 1.75rem' }}>
                            <h4 style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem', marginBottom: '1rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Why Choose Mount?</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {[
                                    'All professionals verified & vetted',
                                    'Secure payment system',
                                    'Quality guarantee & dispute resolution',
                                    'Real-time job tracking & updates',
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                                        </div>
                                        <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: 500 }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CEO Card */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            background: '#fff', borderRadius: '24px', padding: '2.5rem 2rem',
                            border: '1.5px solid #e8ede9', textAlign: 'center',
                            boxShadow: '0 24px 64px rgba(26,122,74,0.1)', maxWidth: '360px', width: '100%',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Decorative corner */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'var(--green-light)', borderRadius: '0 24px 0 120px', opacity: 0.6 }}></div>

                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--gold))', padding: '3px' }}></div>
                                    <img
                                        src={ceoImage}
                                        alt="Adelua Victor - Founder & CEO of Mount"
                                        style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', display: 'block', position: 'relative' }}
                                    />
                                </div>

                                <h3 className="display-font" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>Adelua Victor</h3>
                                <p style={{ color: 'var(--green)', fontWeight: 600, marginBottom: '1.25rem', fontSize: '0.9rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Founder & CEO</p>

                                <div style={{ width: '100%', height: '1px', background: '#e8ede9', marginBottom: '1.25rem' }}></div>

                                <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                                    "We started Mount because we experienced firsthand the challenges of finding reliable home services in Nigeria. Our goal is to build trust and make quality home services accessible to every Nigerian."
                                </p>

                                <a href="https://www.linkedin.com/in/victor-adelua-115bb51b2/" target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#0077b5', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    Connect on LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section style={{ padding: '5rem 1.5rem', background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)', pointerEvents: 'none' }}></div>

                <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                    <span className="gold-line" style={{ display: 'block', margin: '0 auto 1.5rem' }}></span>
                    <h2 className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                        Ready to Get Started?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        Trust Mount for all your home service needs. Quality guaranteed, payments secured.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={handleGetStartedClick}
                            style={{ background: '#fff', color: 'var(--green)', fontWeight: 700, padding: '0.9rem 2.25rem', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; }}>
                            Book a Service
                        </button>
                        <button onClick={() => navigate('/for-providers')} className="btn-outline"
                            style={{ padding: '0.9rem 2.25rem', borderRadius: '100px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, background: 'transparent', letterSpacing: '0.01em' }}>
                            Become a Provider
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ background: 'var(--ink)', color: '#fff', padding: '3rem 1.5rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                            <img src={logo} alt="Mount Logo" style={{ height: '32px', width: 'auto' }} />
                            <span className="display-font" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Mount</span>
                        </a>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                            {navLinks.map(link => (
                                <a key={link.name} href={link.href}
                                    style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                                    onMouseOver={e => { e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* NEW: Legal Links Row */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '2rem',
                        marginBottom: '1.5rem',
                        padding: '1rem 0',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <a
                            href="/terms"
                            style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'color 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                            <span>📄</span> Terms of Service
                        </a>
                        <a
                            href="/privacy"
                            style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'color 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                            <span>🔒</span> Privacy & Cookies Policy
                        </a>
                        <a
                            href="/contact"
                            style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'color 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                            <span>📧</span> Contact Us
                        </a>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
                            © {new Date().getFullYear()} Mount Ltd. All rights reserved.
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                            Nigeria's Trusted Home Services Marketplace
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeOverviewPage;