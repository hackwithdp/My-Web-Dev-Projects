// Student Form Management System
class StudentForm {
    constructor() {
        this.form = document.getElementById('studentForm');
        this.formData = {};
        this.validationRules = this.initializeValidationRules();
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.attachEventListeners();
        this.setupRealTimeValidation();
        this.setupAutoSave();
        
        // Set max date for date of birth (must be at least 16 years old)
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        document.getElementById('dateOfBirth').setAttribute('max', maxDate.toISOString().split('T')[0]);
        
        // Set min date for enrollment (not more than 10 years ago)
        const minEnrollmentDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        document.getElementById('enrollmentDate').setAttribute('min', minEnrollmentDate.toISOString().split('T')[0]);
        document.getElementById('enrollmentDate').setAttribute('max', today.toISOString().split('T')[0]);
    }

    initializeValidationRules() {
        return {
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'First name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
            },
            lastName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Last name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: false,
                pattern: /^[\+]?[\d\s\-\(\)]+$/,
                minLength: 10,
                message: 'Please enter a valid phone number'
            },
            dateOfBirth: {
                required: true,
                custom: (value) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    
                    return age >= 16 && age <= 100;
                },
                message: 'You must be between 16 and 100 years old'
            },
            studentId: {
                required: true,
                pattern: /^[A-Z]{0,3}\d{4,10}$/i,
                message: 'Student ID must contain 4-10 digits, optionally preceded by up to 3 letters'
            },
            course: {
                required: true,
                message: 'Please select a course'
            },
            year: {
                required: true,
                message: 'Please select your academic year'
            },
            enrollmentDate: {
                required: true,
                custom: (value) => {
                    const enrollDate = new Date(value);
                    const today = new Date();
                    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
                    
                    return enrollDate >= tenYearsAgo && enrollDate <= today;
                },
                message: 'Enrollment date must be within the last 10 years and not in the future'
            },
            address: {
                required: true,
                minLength: 5,
                message: 'Address must be at least 5 characters long'
            },
            city: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'City name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
            },
            state: {
                required: true,
                minLength: 2,
                message: 'State/Province must be at least 2 characters long'
            },
            zipCode: {
                required: true,
                pattern: /^[A-Z0-9\s-]+$/i,
                minLength: 3,
                message: 'Please enter a valid ZIP/Postal code'
            },
            country: {
                required: true,
                message: 'Please select a country'
            },
            emergencyName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Contact name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
            },
            emergencyRelation: {
                required: true,
                message: 'Please select the relationship'
            },
            emergencyPhone: {
                required: true,
                pattern: /^[\+]?[\d\s\-\(\)]+$/,
                minLength: 10,
                message: 'Please enter a valid emergency contact phone number'
            },
            emergencyEmail: {
                required: false,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address for emergency contact'
            },
            terms: {
                required: true,
                custom: (value, element) => element.checked,
                message: 'You must agree to the Terms and Conditions'
            }
        };
    }

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        
        // Save draft button
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDraft());
        
        // Prevent multiple submissions
        this.form.addEventListener('submit', (e) => {
            if (this.isSubmitting) {
                e.preventDefault();
                return false;
            }
        });
    }

    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Validate on blur (when user leaves the field)
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
            
            // Clear errors on focus for better UX
            input.addEventListener('focus', (e) => {
                this.clearFieldError(e.target);
            });
            
            // Real-time validation for specific fields
            if (input.type === 'email' || input.name === 'studentId') {
                input.addEventListener('input', (e) => {
                    clearTimeout(this.validationTimeout);
                    this.validationTimeout = setTimeout(() => {
                        this.validateField(e.target);
                    }, 500);
                });
            }
        });
    }

    setupAutoSave() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveToLocalStorage();
            });
        });
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveToLocalStorage();
        }, 30000);
    }

    validateField(field) {
        const fieldName = field.name;
        const fieldValue = field.value.trim();
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        const formGroup = field.closest('.form-group') || field.closest('.checkbox-group');
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        // Check if field is required
        if (rules.required && (!fieldValue || (field.type === 'checkbox' && !field.checked))) {
            this.showFieldError(formGroup, errorElement, `${this.getFieldLabel(field)} is required`);
            return false;
        }
        
        // Skip other validations if field is empty and not required
        if (!fieldValue && !rules.required) {
            this.clearFieldError(field);
            return true;
        }
        
        // Check minimum length
        if (rules.minLength && fieldValue.length < rules.minLength) {
            this.showFieldError(formGroup, errorElement, `${this.getFieldLabel(field)} must be at least ${rules.minLength} characters long`);
            return false;
        }
        
        // Check pattern
        if (rules.pattern && !rules.pattern.test(fieldValue)) {
            this.showFieldError(formGroup, errorElement, rules.message);
            return false;
        }
        
        // Check custom validation
        if (rules.custom && !rules.custom(fieldValue, field)) {
            this.showFieldError(formGroup, errorElement, rules.message);
            return false;
        }
        
        // If we get here, the field is valid
        this.showFieldSuccess(formGroup, errorElement);
        return true;
    }

    showFieldError(formGroup, errorElement, message) {
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showFieldSuccess(formGroup, errorElement) {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group') || field.closest('.checkbox-group');
        const errorElement = document.getElementById(`${field.name}-error`);
        
        formGroup.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    getFieldLabel(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }

    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Please correct the errors above before submitting.', 'error');
            this.scrollToFirstError();
            return;
        }
        
        this.isSubmitting = true;
        this.showLoadingOverlay();
        
        try {
            // Collect form data
            const formData = new FormData(this.form);
            const studentData = {};
            
            for (let [key, value] of formData.entries()) {
                studentData[key] = value;
            }
            
            // Simulate API call (replace with actual endpoint)
            await this.submitToServer(studentData);
            
            // Success
            this.showMessage('Application submitted successfully! You will receive a confirmation email shortly.', 'success');
            this.clearLocalStorage();
            
            // Optionally redirect or reset form
            setTimeout(() => {
                this.resetForm();
            }, 3000);
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showMessage('There was an error submitting your application. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            this.hideLoadingOverlay();
        }
    }

    async submitToServer(data) {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve({ success: true, id: 'ST' + Date.now() });
                } else {
                    reject(new Error('Server error'));
                }
            }, 2000);
        });
    }

    scrollToFirstError() {
        const firstError = this.form.querySelector('.form-group.error, .checkbox-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    resetForm() {
        if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
            this.form.reset();
            this.clearAllErrors();
            this.clearLocalStorage();
            this.showMessage('Form has been reset.', 'info');
        }
    }

    clearAllErrors() {
        const formGroups = this.form.querySelectorAll('.form-group, .checkbox-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
        });
        
        const errorElements = this.form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    saveDraft() {
        this.saveToLocalStorage();
        this.showMessage('Draft saved successfully!', 'info');
    }

    saveToLocalStorage() {
        try {
            const formData = new FormData(this.form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // Also save checkbox states
            const checkboxes = this.form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                data[checkbox.name] = checkbox.checked;
            });
            
            localStorage.setItem('studentFormDraft', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('studentFormDraft');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                Object.keys(data).forEach(key => {
                    const field = this.form.querySelector(`[name="${key}"]`);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = data[key];
                        } else {
                            field.value = data[key];
                        }
                    }
                });
                
                this.showMessage('Previous draft loaded. You can continue where you left off.', 'info');
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    clearLocalStorage() {
        try {
            localStorage.removeItem('studentFormDraft');
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        
        // Remove existing messages
        container.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-triangle' : 
                    'fas fa-info-circle';
        
        messageDiv.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Utility functions for modal dialogs
function showTerms() {
    alert('Terms and Conditions:\n\n1. All information provided must be accurate and truthful.\n2. The institution reserves the right to verify all submitted information.\n3. False information may result in application rejection or enrollment cancellation.\n4. By submitting this form, you agree to receive communications from the institution.\n5. Your personal information will be handled according to our Privacy Policy.');
}

function showPrivacy() {
    alert('Privacy Policy:\n\n1. We collect personal information for enrollment and academic purposes only.\n2. Your information will not be shared with third parties without consent.\n3. We use industry-standard security measures to protect your data.\n4. You have the right to access, update, or delete your personal information.\n5. Cookies may be used to improve your experience on our website.\n\nFor complete terms, please contact our office.');
}

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StudentForm();
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.click();
        }
    }
    
    // Escape to close loading overlay
    if (e.key === 'Escape') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay.style.display === 'flex') {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
});

// Handle page unload to save draft
window.addEventListener('beforeunload', (e) => {
    const form = document.getElementById('studentForm');
    if (form) {
        // Quick save without showing message
        try {
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                data[checkbox.name] = checkbox.checked;
            });
            
            localStorage.setItem('studentFormDraft', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving draft on page unload:', error);
        }
    }
});
