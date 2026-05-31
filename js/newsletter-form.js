// Newsletter Form Handler -> posts to the server-side Worker (/api/newsletter).
// The Worker writes to Firestore using the secret service account; no keys in the browser.
(function() {
  var forms = document.querySelectorAll('#wf-form-Footer-Form');

  forms.forEach(function(form) {
    var successDiv = form.parentElement.querySelector('.success-message');
    var errorDiv = form.parentElement.querySelector('.error-message');

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var emailInput = form.querySelector('input[type="email"]') || document.getElementById('Footer-Email-2');
      var email = emailInput ? emailInput.value : '';

      // Hide previous messages
      if (successDiv) successDiv.style.display = 'none';
      if (errorDiv) errorDiv.style.display = 'none';

      fetch(API_BASE + '/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.success) {
          form.style.display = 'none';
          if (successDiv) successDiv.style.display = 'block';
        } else {
          if (errorDiv) {
            errorDiv.querySelector('div').textContent = result.error || 'Subscription failed';
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
  });
})();
