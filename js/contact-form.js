// Contact Form Handler -> posts to the server-side Worker (/api/contact).
// The Worker writes to Firestore using the secret service account; no keys in the browser.
(function() {
  var form = document.getElementById('wf-form-Contact-Form');
  if (!form) return;

  var successDiv = form.parentElement.querySelector('.success-message-2');
  var errorDiv = form.parentElement.querySelector('.w-form-fail');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var data = {
      name: (document.getElementById('Name-3') || {}).value || '',
      email: (document.getElementById('email') || {}).value || '',
      phone: (document.getElementById('Phone-Number') || {}).value || '',
      subject: (document.getElementById('Subject') || {}).value || '',
      message: (document.getElementById('field') || {}).value || ''
    };

    // Hide previous messages
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';

    fetch(API_BASE + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (result.success) {
        form.style.display = 'none';
        if (successDiv) successDiv.style.display = 'block';
      } else {
        if (errorDiv) {
          var errorMsg = result.errors ? Object.values(result.errors).join(', ') : (result.error || 'Submission failed');
          errorDiv.querySelector('div').textContent = errorMsg;
          errorDiv.style.display = 'block';
        }
      }
    })
    .catch(function() {
      if (errorDiv) {
        errorDiv.querySelector('div').textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
      }
    });
  });
})();
