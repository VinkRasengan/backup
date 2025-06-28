// Debug script for submit flow
console.log('🐛 Debug script loaded');

// Test function to check submit flow
window.debugSubmitFlow = () => {
  console.log('🐛 === SUBMIT FLOW DEBUG ===');
  
  // Check if we're on submit page
  if (!window.location.pathname.includes('/submit')) {
    console.log('❌ Not on submit page');
    return;
  }
  
  // Check if form elements exist
  const urlInput = document.querySelector('input[type="url"]');
  const titleInput = document.querySelector('input[placeholder*="tiêu đề"]');
  const categorySelect = document.querySelector('select');
  const submitButtons = document.querySelectorAll('button');
  
  console.log('🐛 Form elements found:');
  console.log('  - URL input:', !!urlInput, urlInput?.value);
  console.log('  - Title input:', !!titleInput, titleInput?.value);
  console.log('  - Category select:', !!categorySelect, categorySelect?.value);
  console.log('  - Submit buttons:', submitButtons.length);
  
  // Find the submit button
  const submitButton = Array.from(submitButtons).find(btn => 
    btn.textContent.includes('Gửi đến cộng đồng')
  );
  
  console.log('🐛 Submit button found:', !!submitButton);
  
  if (submitButton) {
    console.log('🐛 Submit button details:', {
      disabled: submitButton.disabled,
      onclick: !!submitButton.onclick,
      listeners: getEventListeners ? getEventListeners(submitButton) : 'N/A'
    });
  }
  
  // Check React state
  const reactFiber = document.querySelector('#root')?._reactInternalInstance ||
                    document.querySelector('#root')?._reactInternals;
  console.log('🐛 React fiber found:', !!reactFiber);
  
  return {
    urlInput: urlInput?.value,
    titleInput: titleInput?.value,
    categorySelect: categorySelect?.value,
    submitButton: !!submitButton,
    reactFiber: !!reactFiber
  };
};

// Auto run on load
setTimeout(() => {
  if (window.location.pathname.includes('/submit')) {
    window.debugSubmitFlow();
  }
}, 2000); 