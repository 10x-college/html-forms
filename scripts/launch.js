// Europa-1 Launch Control System
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Prevent default form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate all required fields
        if (validateForm()) {
            initiateLaunch();
        }
    });
    
    // Validation function
    function validateForm() {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;
        
        // Clear previous error states
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        requiredFields.forEach(field => {
            field.style.borderBottom = '1px solid var(--jupiter-warm-tan)';
        });
        
        requiredFields.forEach(field => {
            let fieldValue = field.value.trim();
            let fieldValid = true;
            
            // Check if field is empty
            if (!fieldValue) {
                fieldValid = false;
            }
            
            // Additional validation for specific field types
            if (fieldValid && field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                fieldValid = emailRegex.test(fieldValue);
            }
            
            if (fieldValid && field.type === 'number') {
                fieldValid = !isNaN(fieldValue) && fieldValue !== '';
            }
            
            if (fieldValid && field.type === 'checkbox') {
                fieldValid = field.checked;
            }
            
            // Mark invalid fields
            if (!fieldValid) {
                isValid = false;
                field.style.borderBottom = '2px solid #d9534f';
                
                // Add error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.style.color = '#d9534f';
                errorMsg.style.fontSize = '0.8rem';
                errorMsg.style.marginTop = '0.3vh';
                errorMsg.textContent = getErrorMessage(field);
                
                if (field.type === 'checkbox') {
                    field.parentElement.appendChild(errorMsg);
                } else {
                    field.parentElement.insertBefore(errorMsg, field.nextSibling);
                }
                
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });
        
        // Scroll to first invalid field
        if (!isValid && firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        
        return isValid;
    }
    
    // Get appropriate error message
    function getErrorMessage(field) {
        if (field.type === 'email') {
            return 'Please enter a valid email address';
        } else if (field.type === 'checkbox') {
            return 'You must agree to proceed';
        } else if (field.type === 'number') {
            return 'Please enter a valid number';
        } else if (field.value.trim() === '') {
            return 'This field is required';
        }
        return 'Invalid input';
    }
    
    // Launch sequence
    function initiateLaunch() {
        // Disable form
        submitButton.disabled = true;
        submitButton.textContent = 'LAUNCHING...';
        
        // Start shake animation
        shakeEverything();
        
        // After shake, launch spaceship
        setTimeout(() => {
            launchSpaceship();
        }, 1200);
    }
    
    // Shake animation
    function shakeEverything() {
        // Add shake class to body
        document.body.style.animation = 'shake 1.2s ease-in-out';
        
        // Add shake keyframes if not exists
        if (!document.getElementById('shake-keyframes')) {
            const style = document.createElement('style');
            style.id = 'shake-keyframes';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-5px, -5px); }
                    20% { transform: translate(5px, 5px); }
                    30% { transform: translate(-8px, 2px); }
                    40% { transform: translate(8px, -2px); }
                    50% { transform: translate(-5px, 5px); }
                    60% { transform: translate(5px, -5px); }
                    70% { transform: translate(-8px, -3px); }
                    80% { transform: translate(8px, 3px); }
                    90% { transform: translate(-3px, -3px); }
                }
                
                @keyframes launchToCenter {
                    0% {
                        bottom: -200px;
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        bottom: 40vh;
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                    }
                }
                
                @keyframes exhaustTrail {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                        bottom: -30px;
                    }
                    100% {
                        opacity: 0;
                        transform: scale(3);
                        bottom: -170px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Launch spaceship animation
    function launchSpaceship() {
        // Reset body animation
        document.body.style.animation = '';
        
        // Fade out form
        form.style.animation = 'fadeOut 1s ease-out forwards';
        
        // Create space acceleration canvas
        createSpaceCanvas();
        
        // Create spaceship container (starts from bottom)
        const spaceshipContainer = document.createElement('div');
        spaceshipContainer.style.cssText = `
            position: fixed;
            bottom: -200px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            pointer-events: none;
            width: 180px;
        `;
        
        // Create spaceship image
        const spaceship = document.createElement('img');
        spaceship.src = './styles/spaceship.png';
        spaceship.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            filter: drop-shadow(0 0 30px rgba(139, 111, 71, 0.9));
        `;
        
        spaceshipContainer.appendChild(spaceship);
        document.body.appendChild(spaceshipContainer);
        
        // Create engine exhaust effect
        createExhaustEffect(spaceshipContainer);
        
        // Animate spaceship to center and hold position
        setTimeout(() => {
            spaceshipContainer.style.animation = 'launchToCenter 1.5s cubic-bezier(0.45, 0, 0.55, 1) forwards';
        }, 100);
        
        // Show inspiring modal after 3 seconds
        setTimeout(() => {
            showInspiringModal();
        }, 3000);
    }
    
    // Create exhaust/engine glow effect (infinite)
    function createExhaustEffect(container) {
        setInterval(() => {
            const exhaust = document.createElement('div');
            exhaust.style.cssText = `
                position: absolute;
                bottom: -30px;
                left: 50%;
                margin-left: -30px;
                width: 60px;
                height: 60px;
                background: radial-gradient(circle, rgba(100, 200, 255, 1), rgba(50, 150, 255, 0.6), transparent);
                border-radius: 50%;
                animation: exhaustTrail 0.8s ease-out forwards;
                pointer-events: none;
            `;
            container.appendChild(exhaust);
            
            setTimeout(() => exhaust.remove(), 800);
        }, 60);
    }
    
    // Create space acceleration canvas background
    function createSpaceCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'space-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Create stars
        const stars = [];
        const numStars = 200;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * canvas.width,
                size: Math.random() * 2
            });
        }
        
        let animationSpeed = 0;
        const maxSpeed = 20;
        
        function animateSpace() {
            // Gradually increase speed
            if (animationSpeed < maxSpeed) {
                animationSpeed += 0.3;
            }
            
            // Clear with fade effect for motion blur
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw and update stars
            stars.forEach(star => {
                // Calculate star position
                const x = (star.x - canvas.width / 2) * (canvas.width / star.z);
                const y = (star.y - canvas.height / 2) * (canvas.width / star.z);
                
                const realX = x + canvas.width / 2;
                const realY = y + canvas.height / 2;
                
                // Calculate star size based on depth
                const size = (1 - star.z / canvas.width) * star.size * 2;
                
                // Draw star
                ctx.fillStyle = `rgba(${201 + size * 20}, ${184 + size * 20}, ${153 + size * 20}, ${0.8 + size / 10})`;
                ctx.beginPath();
                ctx.arc(realX, realY, Math.max(size, 0.5), 0, Math.PI * 2);
                ctx.fill();
                
                // Draw motion trail for speed effect
                if (animationSpeed > 5) {
                    const trailLength = animationSpeed * 2;
                    ctx.strokeStyle = `rgba(201, 184, 153, ${0.3 * (1 - star.z / canvas.width)})`;
                    ctx.lineWidth = size / 2;
                    ctx.beginPath();
                    ctx.moveTo(realX, realY);
                    ctx.lineTo(realX, realY + trailLength);
                    ctx.stroke();
                }
                
                // Move star closer
                star.z -= animationSpeed;
                
                // Reset star if it goes past the screen
                if (star.z <= 0) {
                    star.z = canvas.width;
                    star.x = Math.random() * canvas.width;
                    star.y = Math.random() * canvas.height;
                }
            });
            
            requestAnimationFrame(animateSpace);
        }
        
        animateSpace();
    }
    
    // Show inspiring modal with quote
    function showInspiringModal() {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10002;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.5s ease-out;
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: rgba(26, 18, 8, 0.98);
            border: 2px solid var(--jupiter-warm-tan);
            border-radius: 15px;
            padding: 50px 60px;
            text-align: center;
            z-index: 10003;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            max-width: 600px;
            animation: modalAppear 0.5s ease-out forwards;
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 30px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🚀</div>
                <h2 style="color: var(--jupiter-light-cream); font-family: 'Syncopate', sans-serif; font-size: 1.8rem; margin: 0 0 15px 0; letter-spacing: 2px;">
                    DEPARTURE SUCCESSFUL
                </h2>
            </div>
            <div style="
                border-left: 3px solid var(--jupiter-rust);
                padding-left: 25px;
                margin: 30px 0;
                text-align: left;
            ">
                <p style="
                    color: var(--jupiter-soft-cream); 
                    font-size: 1.2rem; 
                    line-height: 1.8;
                    margin: 0 0 10px 0;
                    font-style: italic;
                    font-family: 'Space Grotesk', sans-serif;
                ">
                    "Somewhere, something incredible is waiting to be known."
                </p>
                <p style="
                    color: var(--jupiter-warm-tan);
                    font-size: 0.95rem;
                    margin: 0;
                    text-align: right;
                    font-family: 'Space Grotesk', sans-serif;
                ">
                    — Carl Sagan
                </p>
            </div>
            <p style="color: var(--jupiter-warm-tan); font-size: 0.95rem; margin: 25px 0 35px 0; line-height: 1.6;">
                Your transmission has been sent. Europa-1 is now en route to Jupiter.<br>
                The adventure has just begun.
            </p>
            <button onclick="location.reload()" style="
                background: linear-gradient(135deg, var(--jupiter-rust), var(--jupiter-deep-orange));
                border: none;
                border-radius: 8px;
                color: var(--jupiter-light-cream);
                padding: 16px 40px;
                font-family: 'Syncopate', sans-serif;
                font-weight: bold;
                font-size: 0.9rem;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 2px;
                transition: transform 0.2s, box-shadow 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 20px rgba(139, 90, 60, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                New Mission
            </button>
        `;
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalAppear {
                from { 
                    transform: translate(-50%, -50%) scale(0.9);
                    opacity: 0;
                }
                to { 
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    }
});


