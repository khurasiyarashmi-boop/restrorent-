/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

export default function App() {
  const [preloaderHidden, setPreloaderHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [menuProgress, setMenuProgress] = useState(0);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  // Preloader lifecycle
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPreloaderHidden(true);
    }, 1800);

    return () => clearTimeout(timer1);
  }, []);

  // Custom Cursor & Magnetic Buttons
  useEffect(() => {
    const cursorDot = cursorDotRef.current;
    const cursorRing = cursorRingRef.current;
    if (!cursorDot || !cursorRing) return;

    // Enable custom cursor styles on body for desktop
    if (window.innerWidth > 768) {
      document.body.classList.add('custom-cursor-enabled');
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let cursorVisible = false;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!cursorVisible) {
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
        cursorVisible = true;
      }

      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      animationFrameId = requestAnimationFrame(animateRing);
    };
    animationFrameId = requestAnimationFrame(animateRing);

    const handleMouseLeave = () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
      cursorVisible = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Magnetic buttons setup
    const magneticElements = document.querySelectorAll<HTMLElement>('[data-magnetic]');
    const handleMagneticMove = function (this: HTMLElement, e: MouseEvent) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      this.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.04)`;
    };
    const handleMagneticLeave = function (this: HTMLElement) {
      this.style.transform = 'translate(0, 0) scale(1)';
    };

    magneticElements.forEach((el) => {
      el.addEventListener('mousemove', handleMagneticMove);
      el.addEventListener('mouseleave', handleMagneticLeave);
    });

    return () => {
      document.body.classList.remove('custom-cursor-enabled');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      magneticElements.forEach((el) => {
        el.removeEventListener('mousemove', handleMagneticMove);
        el.removeEventListener('mouseleave', handleMagneticLeave);
      });
    };
  }, []);

  // Cursor Hover Effects for interactive elements
  const onHoverEnter = (type?: 'view' | 'drag' | 'hover') => {
    const ring = cursorRingRef.current;
    if (!ring) return;
    ring.classList.add('hover-active');
    if (type === 'view') ring.classList.add('view-active');
    if (type === 'drag') ring.classList.add('drag-active');
  };

  const onHoverLeave = () => {
    const ring = cursorRingRef.current;
    if (!ring) return;
    ring.classList.remove('hover-active', 'view-active', 'drag-active');
  };

  // Navbar scroll & Intersection Observer for reveal items + active links
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['hero', 'about', 'menu-highlights', 'gallery', 'features', 'reviews', 'location'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Reveal on scroll
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Menu horizontal drag and scroll progress
  useEffect(() => {
    const menuEl = menuContainerRef.current;
    if (!menuEl) return;

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - menuEl.offsetLeft;
      scrollStart = menuEl.scrollLeft;
      menuEl.classList.add('dragging');
      onHoverEnter('drag');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - menuEl.offsetLeft;
      const walk = (x - startX) * 1.5;
      menuEl.scrollLeft = scrollStart - walk;
    };

    const handleMouseUp = () => {
      isDown = false;
      menuEl.classList.remove('dragging');
      onHoverLeave();
    };

    const handleScroll = () => {
      const scrollable = menuEl.scrollWidth - menuEl.clientWidth;
      if (scrollable > 0) {
        const progress = (menuEl.scrollLeft / scrollable) * 100;
        setMenuProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    menuEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    menuEl.addEventListener('scroll', handleScroll);

    return () => {
      menuEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      menuEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Custom Cursor */}
      <div className="cursor-dot" id="cursorDot" ref={cursorDotRef} />
      <div className="cursor-ring" id="cursorRing" ref={cursorRingRef} />

      {/* Preloader */}
      <div id="preloader" className={preloaderHidden ? 'hidden' : ''} aria-hidden={preloaderHidden}>
        <div className="preloader-text">
          <span>S</span>
          <span>E</span>
          <span>R</span>
          <span>E</span>
          <span>N</span>
          <span>D</span>
          <span>I</span>
          <span>P</span>
          <span>I</span>
          <span>T</span>
          <span>Y</span>
        </div>
        <div className="preloader-line" />
        <div className="preloader-sub">सेरेनदीपिटी कैफे</div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        id="mobileMenu"
        aria-hidden={!mobileMenuOpen}
      >
        <a href="#about" onClick={(e) => scrollToSection(e, '#about')}>
          About
        </a>
        <a href="#menu-highlights" onClick={(e) => scrollToSection(e, '#menu-highlights')}>
          Menu
        </a>
        <a href="#gallery" onClick={(e) => scrollToSection(e, '#gallery')}>
          Gallery
        </a>
        <a href="#reviews" onClick={(e) => scrollToSection(e, '#reviews')}>
          Reviews
        </a>
        <a href="#location" onClick={(e) => scrollToSection(e, '#location')}>
          Visit Us
        </a>
        <a href="tel:09644333944" className="mobile-cta">
          📞 Call: 096443 33944
        </a>
      </div>

      {/* Navigation */}
      <nav
        id="navbar"
        role="navigation"
        aria-label="Main navigation"
        className={isScrolled ? 'scrolled' : ''}
      >
        <span className="nav-logo" onMouseEnter={() => onHoverEnter('hover')} onMouseLeave={onHoverLeave}>
          SC
        </span>
        <ul className="nav-links" id="navLinks">
          <li>
            <a
              href="#about"
              className={activeSection === 'about' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#about')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              About
            </a>
          </li>
          <li>
            <a
              href="#menu-highlights"
              className={activeSection === 'menu-highlights' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#menu-highlights')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              Menu
            </a>
          </li>
          <li>
            <a
              href="#gallery"
              className={activeSection === 'gallery' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#gallery')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              Gallery
            </a>
          </li>
          <li>
            <a
              href="#reviews"
              className={activeSection === 'reviews' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#reviews')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              Reviews
            </a>
          </li>
          <li>
            <a
              href="#location"
              className={activeSection === 'location' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#location')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              Visit
            </a>
          </li>
          <li>
            <a
              href="tel:09644333944"
              className="nav-cta"
              data-magnetic
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              Reserve
            </a>
          </li>
        </ul>
        <button
          className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
          id="mobileToggle"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Hero Section */}
      <section id="hero" aria-label="Hero">
        <div className="hero-video-bg">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
            <source src="https://v1.pinimg.com/videos/iht/expMp4/86/27/39/862739d06fe92ac193225cbb235b5d72_720w.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Jabalpur's Cozy Hangout · 4.1★
          </div>
          <h1 className="hero-title">
            <span className="line">
              <span>Where Flavors</span>
            </span>
            <span className="line">
              <span>
                Meet <span className="accent-word">Serendipity</span>
              </span>
            </span>
          </h1>
          <p className="hero-hindi">सेरेनदीपिटी कैफे — जहाँ स्वाद मिलता है खुशनसीबी से</p>
          <p className="hero-subtitle">
            Delicious food, beautiful ambience, and warm hospitality in the heart of Napier Town.
            Dine-in · Takeaway · Delivery available.
          </p>
          <div className="hero-rating">
            <span className="stars">★★★★☆</span>
            <span className="rating-num">4.1</span>
            <span className="reviews-count">(136 Google Reviews)</span>
          </div>
          <div className="hero-ctas">
            <a
              href="tel:09644333944"
              className="btn-primary"
              data-magnetic
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              📞 Reserve a Table
            </a>
            <a
              href="#menu-highlights"
              className="btn-secondary"
              data-magnetic
              onClick={(e) => scrollToSection(e, '#menu-highlights')}
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              🍽️ Explore Menu
            </a>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <div className="line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* Ticker Strip */}
      <div id="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>Honey Chilli Potato</span>
          <span>Kaju Masala</span>
          <span>Dal Bukhara</span>
          <span>Kadhai Paneer</span>
          <span>Tandoori Roti</span>
          <span>Standard Thali</span>
          <span>Honey Chilli Potato</span>
          <span>Kaju Masala</span>
          <span>Dal Bukhara</span>
          <span>Kadhai Paneer</span>
          <span>Tandoori Roti</span>
          <span>Standard Thali</span>
        </div>
      </div>

      {/* About Section */}
      <section id="about" aria-label="About Serendipity Cafe">
        <div className="about-text">
          <h2>
            A <span className="highlight">Serendipitous</span> Discovery
          </h2>
          <p>
            Tucked away in Napier Town, Serendipity Cafe is more than just a restaurant — it's a
            destination for those who appreciate good food, warm company, and a beautiful atmosphere.
          </p>
          <div className="about-divider">
            <span className="line" />
            <span>◆</span>
            <span className="line" />
          </div>
          <p>
            From our signature Kaju Masala to the comforting Dal Bukhara, every dish is crafted with
            care and served with a smile. Our staff takes pride in being polite, attentive, and
            genuinely happy to make your visit memorable.
          </p>
          <blockquote className="about-blockquote">
            "Good ambience, delicious food and a perfect spot for hangout."
            <cite>— Google Review, 5 Stars</cite>
          </blockquote>
          <div className="about-stats">
            <div className="stat">
              <div className="stat-num">136+</div>
              <div className="stat-label">Reviews</div>
            </div>
            <div className="stat">
              <div className="stat-num">4.1★</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-num">₹200-600</div>
              <div className="stat-label">Per Person</div>
            </div>
          </div>
        </div>
        <div className="about-image reveal">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80"
            alt="Serendipity Cafe interior with warm ambience"
            loading="lazy"
          />
          <div className="floating-rating">
            <span className="big-num">4.1</span>
            <div>
              <div className="stars" style={{ color: 'var(--accent-gold)', fontSize: '0.7rem' }}>
                ★★★★☆
              </div>
              <div className="label">136 Google Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights Section */}
      <section id="menu-highlights" aria-label="Menu Highlights">
        <div className="section-header">
          <h2>
            Signature <span className="accent">Flavors</span>
          </h2>
          <p className="subtitle">Scroll or drag horizontally to explore our most-loved dishes</p>
        </div>
        <div className="menu-horizontal" id="menuHorizontal" ref={menuContainerRef}>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80"
                alt="Honey Chilli Potato"
                loading="lazy"
              />
              <span className="card-badge">Popular</span>
            </div>
            <div className="card-body">
              <h3>Honey Chilli Potato</h3>
              <div className="price">₹180 — ₹220</div>
              <p>Crispy potato tossed in sweet and spicy honey-chilli glaze. A cafe favorite.</p>
            </div>
          </div>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80"
                alt="Kaju Masala"
                loading="lazy"
              />
              <span className="card-badge">Chef's Pick</span>
            </div>
            <div className="card-body">
              <h3>Kaju Masala</h3>
              <div className="price">₹320 — ₹400</div>
              <p>Rich, creamy cashew curry with aromatic spices. Diners highlight this flavorful dish.</p>
            </div>
          </div>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80"
                alt="Dal Bukhara"
                loading="lazy"
              />
              <span className="card-badge">Must Try</span>
            </div>
            <div className="card-body">
              <h3>Dal Bukhara</h3>
              <div className="price">₹250 — ₹300</div>
              <p>Slow-cooked black lentils with butter and cream. Smooth, rich, and comforting.</p>
            </div>
          </div>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80"
                alt="Kadhai Paneer"
                loading="lazy"
              />
              <span className="card-badge">Classic</span>
            </div>
            <div className="card-body">
              <h3>Kadhai Paneer</h3>
              <div className="price">₹280 — ₹350</div>
              <p>Paneer tossed with bell peppers and freshly ground kadhai masala. Robust and flavorful.</p>
            </div>
          </div>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80"
                alt="Standard Thali"
                loading="lazy"
              />
              <span className="card-badge">Complete Meal</span>
            </div>
            <div className="card-body">
              <h3>Standard Thali</h3>
              <div className="price">₹200 — ₹300</div>
              <p>A wholesome platter with dal, sabzi, rice, roti, and salad. Perfect for a satisfying lunch.</p>
            </div>
          </div>
          <div
            className="menu-card"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="card-img">
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"
                alt="Burger"
                loading="lazy"
              />
              <span className="card-badge">Cafe Special</span>
            </div>
            <div className="card-body">
              <h3>Serendipity Burger</h3>
              <div className="price">₹150 — ₹200</div>
              <p>Juicy patty with fresh veggies and secret sauce. Served with crispy fries.</p>
            </div>
          </div>
        </div>
        <div className="menu-progress">
          <div className="bar" id="menuProgressBar" style={{ width: `${menuProgress}%` }} />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" aria-label="Gallery">
        <div className="section-header">
          <h2>
            The <span className="accent">Vibe</span>
          </h2>
          <p className="subtitle">A glimpse of our space and the moments we create</p>
        </div>
        <div className="gallery-grid">
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80"
              alt="Cafe interior with rustic decor"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80"
              alt="Coffee and dessert"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80"
              alt="Warm cafe lighting"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=80"
              alt="Delicious food spread"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&q=80"
              alt="Cozy cafe corner"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=600&q=80"
              alt="Food and friends"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80"
              alt="Elegant dining table"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80"
              alt="Tasty food plate"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
          <div
            className="gallery-item reveal"
            data-cursor="view"
            onClick={() =>
              setActiveImageModal('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85')
            }
            onMouseEnter={() => onHoverEnter('view')}
            onMouseLeave={onHoverLeave}
          >
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"
              alt="Cafe food and drink"
              loading="lazy"
            />
            <div className="overlay-tag">View ↗</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" aria-label="Why Choose Us">
        <div className="features-container">
          <div className="features-header">
            <h2>
              Why <span style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Serendipity?</span>
            </h2>
            <p className="subtitle">What makes our cafe special</p>
          </div>
          <div className="features-grid">
            <div
              className="feature-card"
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              <span className="icon">🍽️</span>
              <h3>Delicious & Varied Food</h3>
              <p>From Kaju Masala to Honey Chilli Potato, our menu offers something for every craving.</p>
            </div>
            <div
              className="feature-card"
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              <span className="icon">🤝</span>
              <h3>Polite & Attentive Staff</h3>
              <p>Our team is known for their warm hospitality and attentive service. You'll feel right at home.</p>
            </div>
            <div
              className="feature-card"
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              <span className="icon">✨</span>
              <h3>Beautiful Ambience</h3>
              <p>Aesthetic decor, chill music, and a cozy atmosphere make it a perfect spot to unwind.</p>
            </div>
            <div
              className="feature-card"
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              <span className="icon">💰</span>
              <h3>Affordable Prices</h3>
              <p>₹200-600 per person. Enjoy premium quality food without breaking the bank.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" aria-label="Customer Reviews">
        <div className="reviews-header">
          <div className="rating-summary">
            <span className="big">4.1</span>
            <span className="stars">★★★★☆</span>
            <span className="count">136 Google Reviews</span>
          </div>
          <h2 style={{ marginTop: '10px' }}>
            What Our <span className="accent">Guests</span> Say
          </h2>
        </div>
        <div className="reviews-grid">
          <div
            className="review-card reveal"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="review-header">
              <div className="avatar">SK</div>
              <div>
                <div className="reviewer-name">Shubhangi Kori</div>
                <div className="reviewer-meta">Local Guide · 141 reviews</div>
              </div>
            </div>
            <div className="review-stars">★★★★★</div>
            <p className="review-text">
              "I liked the place. I appreciated the service as well. Apart from their tamatar ka shorba,
              everything was great. Although their middle row seating seems to be a bit congested."
            </p>
            <div className="review-context">🍽️ Dine-in · 6 months ago</div>
          </div>
          <div
            className="review-card reveal"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="review-header">
              <div className="avatar">SS</div>
              <div>
                <div className="reviewer-name">Shubhangi Shukla</div>
                <div className="reviewer-meta">Local Guide · 4 reviews</div>
              </div>
            </div>
            <div className="review-stars">★★★★★</div>
            <p className="review-text">
              "We visited Serendipity Cafe today to celebrate my father's 50th birthday. The ambience was
              pleasant and the restaurant had a nice atmosphere. We ordered Kadhai Paneer, Tandoori Roti,
              Burger and Green salad — the food was really delicious."
            </p>
            <div className="review-context">🎉 Birthday Celebration · 2 months ago</div>
          </div>
          <div
            className="review-card reveal"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="review-header">
              <div className="avatar">SM</div>
              <div>
                <div className="reviewer-name">Sneha Mishra</div>
                <div className="reviewer-meta">Local Guide · 10 reviews</div>
              </div>
            </div>
            <div className="review-stars">★★★★★</div>
            <p className="review-text">
              "Really nice experience. Good communication and behaviour of staff. The food taste was really
              good.. not regretted 💫💫🔥💯"
            </p>
            <div className="review-context">⭐ Excellent Service · 6 months ago</div>
          </div>
          <div
            className="review-card owner-response reveal md:col-span-2"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <div className="response-label">↩️ Owner Response</div>
            <p className="review-text">
              "Thank you so much for your kind words! It makes us incredibly happy to know you enjoyed your
              time at Serendipity Cafe. Your support motivates our team to keep delivering the best
              experience. We can't wait to welcome you again! ☕✨"
            </p>
            <div className="review-context">— Serendipity Cafe Management</div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" aria-label="Location and Hours">
        <div className="location-container">
          <div
            className="location-map reveal"
            onMouseEnter={() => onHoverEnter('hover')}
            onMouseLeave={onHoverLeave}
          >
            <span className="map-pin">📍</span>
            <div className="map-placeholder">
              <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '1rem' }}>
                Serendipity Cafe
              </strong>
              <span style={{ display: 'block', marginTop: '6px' }}>Bhawani Plaza, 4th Bridge Rd</span>
              <span style={{ display: 'block' }}>Malhotra Compound, Napier Town</span>
              <span style={{ display: 'block', marginTop: '10px', color: 'var(--accent)' }}>
                5W5Q+25 Jabalpur
              </span>
            </div>
          </div>
          <div className="location-details">
            <span className="hours-badge">🟢 Open · Closes 12:00 AM</span>
            <h2>
              Visit <span className="accent">Our Cafe</span>
            </h2>
            <div className="location-info-item">
              <span className="icon">📍</span>
              <div>
                <span className="label">Address:</span>
                <br />
                Bhawani Plaza, 4th Bridge Rd,
                <br />
                Malhotra Compound, Napier Town,
                <br />
                Jabalpur, Madhya Pradesh 482001
              </div>
            </div>
            <div className="location-info-item">
              <span className="icon">📞</span>
              <div>
                <span className="label">Phone:</span>
                <br />
                <a
                  href="tel:09644333944"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  096443 33944
                </a>
              </div>
            </div>
            <div className="location-info-item">
              <span className="icon">🕐</span>
              <div>
                <span className="label">Hours:</span>
                <br />
                Open Daily · Closes 12:00 AM
              </div>
            </div>
            <div className="location-info-item">
              <span className="icon">💳</span>
              <div>
                <span className="label">Price Range:</span>
                <br />
                ₹200–600 per person
              </div>
            </div>
            <div className="dine-options">
              <span className="tag">🍽️ Dine-in</span>
              <span className="tag">🛍️ Takeaway</span>
              <span className="tag">🛵 Delivery</span>
              <span className="tag">📱 Order via Swiggy</span>
            </div>
            <div className="popular-times">
              <h4>Popular Times — Tuesdays</h4>
              <div className="popular-bars">
                <div className="bar" style={{ height: '15%' }} title="6 AM" />
                <div className="bar" style={{ height: '30%' }} title="7 AM" />
                <div className="bar" style={{ height: '45%' }} title="8 AM" />
                <div className="bar" style={{ height: '65%' }} title="9 AM" />
                <div className="bar highlight" style={{ height: '90%' }} title="12 PM — Busiest" />
                <div className="bar" style={{ height: '75%' }} title="3 PM" />
                <div className="bar" style={{ height: '60%' }} title="6 PM" />
                <div className="bar" style={{ height: '50%' }} title="9 PM" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer">
        <div className="footer-content">
          <div className="footer-cta-text">
            READY FOR A<br />
            <span className="accent">SERENDIPITOUS</span> MEAL?
          </div>
          <div className="footer-cta-buttons">
            <a
              href="tel:09644333944"
              className="btn-primary"
              data-magnetic
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              📞 Call: 096443 33944
            </a>
            <a
              href="https://maps.google.com/?q=Serendipity+Cafe+Jabalpur"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              data-magnetic
              onMouseEnter={() => onHoverEnter('hover')}
              onMouseLeave={onHoverLeave}
            >
              📍 Get Directions
            </a>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Serendipity Cafe. All rights reserved.</p>
            <div className="footer-links">
              <a href="#about" onClick={(e) => scrollToSection(e, '#about')}>
                About
              </a>
              <a href="#menu-highlights" onClick={(e) => scrollToSection(e, '#menu-highlights')}>
                Menu
              </a>
              <a href="#gallery" onClick={(e) => scrollToSection(e, '#gallery')}>
                Gallery
              </a>
              <a href="#reviews" onClick={(e) => scrollToSection(e, '#reviews')}>
                Reviews
              </a>
              <a href="#location" onClick={(e) => scrollToSection(e, '#location')}>
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Modal Preview */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImageModal}
              alt="Preview"
              className="w-full h-full max-h-[80vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/90 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg cursor-pointer"
              onClick={() => setActiveImageModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

