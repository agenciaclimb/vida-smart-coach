// Debug helpers for profile and check-in issues
export const debugLog = (context, data, error = null) => {
  const timestamp = new Date().toISOString();
  const logLevel = error ? 'ERROR' : 'INFO';
  
  console.group(`[${logLevel}] ${context} - ${timestamp}`);
  
  if (data) {
    console.log('Data:', data);
  }
  
  if (error) {
    console.error('Error:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
  
  console.groupEnd();
};

export const validateProfileData = (profileData) => {
  const errors = [];
  
  if (!profileData.full_name || profileData.full_name.trim() === '') {
    errors.push('Nome completo é obrigatório');
  }
  
  if (profileData.age && (profileData.age < 1 || profileData.age > 120)) {
    errors.push('Idade deve estar entre 1 e 120 anos');
  }
  
  if (profileData.height && (profileData.height < 50 || profileData.height > 250)) {
    errors.push('Altura deve estar entre 50 e 250 cm');
  }
  
  if (profileData.current_weight && (profileData.current_weight < 20 || profileData.current_weight > 500)) {
    errors.push('Peso atual deve estar entre 20 e 500 kg');
  }
  
  if (profileData.target_weight && (profileData.target_weight < 20 || profileData.target_weight > 500)) {
    errors.push('Peso meta deve estar entre 20 e 500 kg');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCheckinData = (checkinData) => {
  const errors = [];
  
  if (!checkinData.mood_score || checkinData.mood_score < 1 || checkinData.mood_score > 5) {
    errors.push('Humor deve ser selecionado (1-5)');
  }
  
  if (!checkinData.sleep_hours || checkinData.sleep_hours <= 0 || checkinData.sleep_hours > 24) {
    errors.push('Horas de sono devem estar entre 0.1 e 24');
  }
  
  if (checkinData.weight && (checkinData.weight < 20 || checkinData.weight > 500)) {
    errors.push('Peso deve estar entre 20 e 500 kg');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced error tracking
export const trackError = (context, error, additionalInfo = {}) => {
  const errorInfo = {
    context,
    message: error.message,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...additionalInfo
  };
  
  // Store in sessionStorage for debugging
  const existingErrors = JSON.parse(sessionStorage.getItem('vidasmart_errors') || '[]');
  existingErrors.push(errorInfo);
  
  // Keep only last 20 errors
  if (existingErrors.length > 20) {
    existingErrors.splice(0, existingErrors.length - 20);
  }
  
  sessionStorage.setItem('vidasmart_errors', JSON.stringify(existingErrors));
  
  console.error(`[${context}] Error tracked:`, errorInfo);
};

export const getTrackedErrors = () => {
  return JSON.parse(sessionStorage.getItem('vidasmart_errors') || '[]');
};

export const clearTrackedErrors = () => {
  sessionStorage.removeItem('vidasmart_errors');
  console.log('Tracked errors cleared');
};