
// Navigation active state management
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Quote carousel functionality
    const quoteCards = document.querySelectorAll('.quote-card');
    let currentQuote = 0;
    
    function showNextQuote() {
        if (quoteCards.length > 0) {
            quoteCards[currentQuote].classList.remove('active');
            currentQuote = (currentQuote + 1) % quoteCards.length;
            quoteCards[currentQuote].classList.add('active');
        }
    }
    
    // Change quote every 4 seconds
    if (quoteCards.length > 0) {
        setInterval(showNextQuote, 4000);
    }

    // Upload functionality
    const uploadZone = document.getElementById('uploadZone');
    const photoInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (uploadZone && photoInput) {
        // Drag and drop functionality
        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = '#22c55e';
            uploadZone.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
        });

        uploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            uploadZone.style.backgroundColor = 'transparent';
        });

        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            uploadZone.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        // Click to upload
        uploadZone.addEventListener('click', function() {
            photoInput.click();
        });

        // File input change
        photoInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    function handleFileUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (previewImg && imagePreview && analyzeBtn) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    analyzeBtn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

const authForms = document.querySelectorAll('.login-form, .signup-form');
authForms.forEach(form => {
    form.addEventListener('submit', function (e) {
        // Do nothing — let the browser and Flask handle the POST
    });
});
const uploadForms = document.querySelectorAll('.upload-form');
uploadForms.forEach(form => {
    form.addEventListener('submit', function (e) {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            // submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            // submitBtn.disabled = true;
        }
    });
});


    // Load user data on dashboard
    if (window.location.pathname.includes('dashboard')) {
        const userData = JSON.parse(localStorage.getItem('biteWiseUser') || '{}');
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && userData.username) {
            userNameElement.textContent = userData.username;
        }
    }

    // Animate progress bars
    const progressBars = document.querySelectorAll('.progress-fill, .score-fill');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const progressObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'width 1s ease';
            }
        });
    }, observerOptions);

    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });

    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card, .feature-card, .dashboard-card, .score-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Camera functionality for upload page
function openCamera() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.setAttribute('capture', 'environment');
        photoInput.click();
    }
}

// Remove image preview
function removeImage() {
    const imagePreview = document.getElementById('imagePreview');
    const photoInput = document.getElementById('photoInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (imagePreview) imagePreview.style.display = 'none';
    if (photoInput) photoInput.value = '';
    if (analyzeBtn) analyzeBtn.disabled = true;
}

// Utility functions for enhanced interactivity
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add toast styles if not already present
    if (!document.querySelector('.toast-styles')) {
        const style = document.createElement('style');
        style.className = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 6rem;
                right: 1rem;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                border-left: 4px solid #22c55e;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            .toast-error { border-left-color: #ef4444; }
            .toast-success { border-left-color: #22c55e; }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

document.querySelectorAll('.progress-item').forEach(item => {
    const valueElement = item.querySelector('.progress-value');
    const rawValue = valueElement.textContent.trim();
    const numericValue = rawValue.toLowerCase() === 'n/a' ? 0 : parseFloat(rawValue);

    if (!isNaN(numericValue)) {
      item.querySelector('.progress-fill').style.width = `${numericValue}%`;
    } else {
      item.querySelector('.progress-fill').style.width = `0%`;
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    const hbBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
  
    if (hbBtn && navMenu) {
      hbBtn.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        const expanded = navMenu.classList.contains('show');
        hbBtn.setAttribute('aria-expanded', expanded);
      });
    }
  });
  
//   SIGNUP VALIDATION:

// USERNAME VALIDATION
document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const usernameGuide = document.getElementById('username-guide');
    const guideBox = document.getElementById('confirm-uname');
  
    // Hide guides initially
    if (usernameGuide) usernameGuide.style.display = 'none';
    if (guideBox) guideBox.style.display = 'none';
  
    if (usernameInput && usernameGuide && guideBox) {
      usernameInput.addEventListener('focus', () => {
        guideBox.style.display = 'block';
        usernameGuide.style.display = 'block';
  
        if (usernameInput.value.trim() !== '') {
          checkUserName();
        } else {
          usernameGuide.className = '';
          usernameGuide.textContent = 'Username must be 5-20 alphanumeric characters.';
        }
      });
  
      usernameInput.addEventListener('blur', () => {
        guideBox.style.display = 'none';
        usernameGuide.style.display = 'none';
      });
  
      usernameInput.addEventListener('input', checkUserName);
  
      function checkUserName() {
        const uname_condition = /^[a-zA-Z0-9]{5,20}$/.test(usernameInput.value);
        if (uname_condition) {
          usernameGuide.className = 'valid';
          usernameGuide.textContent = 'Looks good!';
        } else {
          usernameGuide.className = '';
          usernameGuide.textContent = 'Username must be 5-20 alphanumeric characters.';
        }
      }
    }
  });
  

  document.addEventListener('DOMContentLoaded', () => {
    // EMAIL VALIDATION
    const emailInput = document.getElementById('email');
    const emailGuide = document.getElementById('email-guide');
    const emailMsg = document.getElementById('email-msg');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (emailInput && emailGuide && emailMsg) {
      emailGuide.style.display = 'none'; // Hide initially
  
      emailInput.addEventListener('focus', () => {
        emailGuide.style.display = 'block';
        validateEmail();
      });
  
      emailInput.addEventListener('blur', () => {
        emailGuide.style.display = 'none';
      });
  
      emailInput.addEventListener('input', validateEmail);
  
      function validateEmail() {
        const isValid = emailRegex.test(emailInput.value);
        if (isValid) {
          emailMsg.className = 'valid';
          emailMsg.textContent = 'Email looks good!';
        } else {
          emailMsg.className = '';
          emailMsg.textContent = 'Enter a valid email address.';
        }
      }
    }
  
    // PASSWORD VALIDATION
    const passwordInput = document.getElementById('password');
    const guide = document.getElementById('password-guide');
  
    const rules = {
      length: val => val.length >= 8 && val.length <= 12,
      uppercase: val => /[A-Z]/.test(val),
      lowercase: val => /[a-z]/.test(val),
      number: val => /\d/.test(val),
      special: val => /[!@#$%^&*]/.test(val)
    };
  
    function validatePassword(val) {
      for (const [key, check] of Object.entries(rules)) {
        const element = document.getElementById(key);
        if (element) {
          element.className = check(val) ? 'valid' : '';
        }
      }
    }
  
    if (passwordInput && guide) {
      guide.style.display = 'none'; // Hide initially
  
      passwordInput.addEventListener('focus', () => {
        guide.style.display = 'block';
      });
  
      passwordInput.addEventListener('blur', () => {
        guide.style.display = 'none';
      });
  
      passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput.value);
        checkMatch(); // Also validate match
      });
    }
  
    // CONFIRM PASSWORD VALIDATION
    const confirmInput = document.getElementById('confirm_password');
    const confirmGuide = document.getElementById('confirm-guide');
    const matchMsg = document.getElementById('match-msg');
  
    function checkMatch() {
      if (!passwordInput || !confirmInput || !matchMsg) return;
  
      const match = passwordInput.value === confirmInput.value && confirmInput.value.length > 0;
      matchMsg.className = match ? 'valid' : '';
      matchMsg.textContent = match ? 'Passwords match' : 'Passwords must match';
    }
  
    if (confirmInput && confirmGuide) {
      confirmGuide.style.display = 'none'; // Hide initially
  
      confirmInput.addEventListener('focus', () => {
        confirmGuide.style.display = 'block';
        checkMatch();
      });
  
      confirmInput.addEventListener('blur', () => {
        confirmGuide.style.display = 'none';
      });
  
      confirmInput.addEventListener('input', checkMatch);
    }
  
    // PASSWORD VISIBILITY TOGGLE - SIGNUP
    const toggleBtn = document.getElementById("toggleConfirmPassword");
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = passwordInput.getAttribute("type") === "password";
        passwordInput.setAttribute("type", isHidden ? "text" : "password");
        toggleBtn.classList.toggle("fa-eye");
        toggleBtn.classList.toggle("fa-eye-slash");
      });
    }
  
    // PASSWORD VISIBILITY TOGGLE - LOGIN
    const loginToggleBtn = document.getElementById("toggleConfirmPassword_login");
    if (loginToggleBtn && passwordInput) {
      loginToggleBtn.addEventListener("click", () => {
        const isHidden = passwordInput.getAttribute("type") === "password";
        passwordInput.setAttribute("type", isHidden ? "text" : "password");
        loginToggleBtn.classList.toggle("fa-eye");
        loginToggleBtn.classList.toggle("fa-eye-slash");
      });
    }
  });
  
//   Pure FRONTEND Section

// Navigation functionality
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.querySelector('.hamburger');
    
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Smooth scrolling to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            
            // Add staggered animations for feature items
            const features = entry.target.querySelectorAll('.feature-item, .capability-item, .feature-card');
            features.forEach((feature, index) => {
                setTimeout(() => {
                    feature.style.animation = `slideInUp 0.6s ease-out ${index * 0.1}s both`;
                }, index * 100);
            });
        }
    });
}, observerOptions);

// Observe all step sections and feature containers
document.addEventListener('DOMContentLoaded', function() {
    // Observe sections for scroll animations
    const sections = document.querySelectorAll('.step-section, .features-showcase, .cta-section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Add scroll-triggered animations
    window.addEventListener('scroll', handleScroll);
    
    // Initialize particles
    createParticles();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Handle scroll animations
function handleScroll() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-icons i');
    
    // Parallax effect for floating icons
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
    });
    
    // Update navbar background opacity
    const navbar = document.querySelector('.navbar');
    const opacity = Math.min(scrolled / 100, 0.95);
    navbar.style.background = `rgba(0, 0, 0, ${opacity})`;
}

// Create animated particles for scan section
function createParticles() {
    const particleContainer = document.querySelector('.scan-particles');
    if (!particleContainer) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #22c55e;
            border-radius: 50%;
            opacity: 0;
            animation: particleFloat ${2 + Math.random() * 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        particleContainer.appendChild(particle);
    }
}

// Add particle animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0);
        }
        50% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.8s ease-out both;
    }
`;
document.head.appendChild(style);

// Interactive hover effects for feature cards
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(34, 197, 94, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 40px rgba(34, 197, 94, 0.2)';
        });
    });
    
    // Add click effect to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Advanced scroll effects
let ticking = false;

function updateScrollEffects() {
    const scrolled = window.pageYOffset;
    
    // Parallax background elements
    const backgrounds = document.querySelectorAll('.hero-background, .step-section');
    backgrounds.forEach((bg, index) => {
        const speed = 0.5 + (index * 0.1);
        bg.style.transform = `translateY(${scrolled * speed * 0.5}px)`;
    });
    
    // Scale effect for phone mockups
    const phones = document.querySelectorAll('.phone-mockup, .phone-frame');
    phones.forEach(phone => {
        const rect = phone.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (inView) {
            const progress = 1 - Math.abs(rect.top) / window.innerHeight;
            const scale = 0.8 + (progress * 0.2);
            phone.style.transform = `scale(${scale})`;
        }
    });
    
    ticking = false;
}

function requestScrollUpdate() {
    if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
    }
}

window.addEventListener('scroll', requestScrollUpdate);

// Enhanced mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Close mobile menu when a link is clicked
            const navLinksContainer = document.getElementById('navLinks');
            const hamburger = document.querySelector('.hamburger');
            
            if (navLinksContainer.classList.contains('active')) {
                navLinksContainer.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
});

// Preload animations
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Trigger initial animations
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero-title .title-line');
        heroElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.2}s`;
            element.classList.add('animate-in');
        });
    }, 100);
});




//Personalised Section


// Personalization Section Interactive Demo
document.addEventListener('DOMContentLoaded', function() {
    initializePersonalizationDemo();
});

function initializePersonalizationDemo() {
    const formSections = document.querySelectorAll('.form-section');
    const stepDots = document.querySelectorAll('.step-dot');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const progressFill = document.querySelector('.progress-fill');
    
    let currentStep = 0;
    const totalSteps = formSections.length;
    
    // Initialize demo
    updateFormDisplay();
    
    // Auto-advance demo every 4 seconds
    setInterval(() => {
        currentStep = (currentStep + 1) % totalSteps;
        updateFormDisplay();
    }, 4000);
    
    // Navigation button handlers
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                updateFormDisplay();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateFormDisplay();
            }
        });
    }
    
    // Interactive goal options
    const goalOptions = document.querySelectorAll('.goal-option');
    goalOptions.forEach(option => {
        option.addEventListener('click', () => {
            goalOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    // Interactive diet tags
    const dietTags = document.querySelectorAll('.diet-tag');
    dietTags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
        });
    });
    
    function updateFormDisplay() {
        // Update sections
        formSections.forEach((section, index) => {
            section.classList.toggle('active', index === currentStep);
        });
        
        // Update step indicators
        stepDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentStep);
        });
        
        // Update progress bar
        if (progressFill) {
            const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update navigation buttons
        if (prevBtn) {
            prevBtn.style.opacity = currentStep === 0 ? '0.5' : '1';
            prevBtn.disabled = currentStep === 0;
        }
        
        if (nextBtn) {
            nextBtn.style.opacity = currentStep === totalSteps - 1 ? '0.5' : '1';
            nextBtn.disabled = currentStep === totalSteps - 1;
        }
    }
    
    // Add hover effects to benefit items
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            item.style.animationPlayState = 'paused';
            item.style.transform = 'translateX(10px) translateY(-5px)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.animationPlayState = 'running';
            item.style.transform = '';
        });
    });
    
    // Add interactive animations to form fields
    const fieldGroups = document.querySelectorAll('.field-group');
    fieldGroups.forEach(field => {
        field.addEventListener('mouseenter', () => {
            field.style.transform = 'scale(1.02)';
            field.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        });
        
        field.addEventListener('mouseleave', () => {
            field.style.transform = 'scale(1)';
            field.style.borderColor = 'rgba(34, 197, 94, 0.1)';
        });
    });
    
    // Simulate typing effect for input fields
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach((field, index) => {
        const originalText = field.textContent;
        
        setTimeout(() => {
            simulateTyping(field, originalText);
        }, index * 1000);
    });
}

function simulateTyping(element, text) {
    let currentText = '';
    let index = 0;
    
    element.textContent = '';
    
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            currentText += text[index];
            element.textContent = currentText;
            index++;
        } else {
            clearInterval(typeInterval);
        }
    }, 100);
}

// Enhanced scroll animations for personalization section
const personalizationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const features = entry.target.querySelectorAll('.personalization-features .feature-item');
            const benefits = entry.target.querySelectorAll('.benefit-item');
            
            // Stagger feature animations
            features.forEach((feature, index) => {
                setTimeout(() => {
                    feature.style.opacity = '0';
                    feature.style.transform = 'translateY(30px)';
                    feature.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        feature.style.opacity = '1';
                        feature.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 150);
            });
            
            // Animate benefits with delay
            setTimeout(() => {
                benefits.forEach((benefit, index) => {
                    benefit.style.opacity = '0';
                    benefit.style.transform = 'translateX(-30px)';
                    benefit.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        benefit.style.opacity = '1';
                        benefit.style.transform = 'translateX(0)';
                    }, index * 200);
                });
            }, 800);
        }
    });
}, {
    threshold: 0.2
});

// Observe personalization section
const personalizationSection = document.querySelector('.personalization-section');
if (personalizationSection) {
    personalizationObserver.observe(personalizationSection);
}

// Add ripple effect to interactive elements
function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(34, 197, 94, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// Apply ripple effect to interactive elements
document.addEventListener('DOMContentLoaded', function() {
    const interactiveElements = document.querySelectorAll('.goal-option, .diet-tag, .nav-btn');
    interactiveElements.forEach(addRippleEffect);
});