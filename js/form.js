const form = document.getElementById("contactForm");
const statusBox = document.getElementById("formStatus");

if (form && statusBox) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const ACCESS_KEY = "cfea5c4a-ddc4-4175-a725-baf79e2205ea";

  const setStatus = (type, message) => {
    statusBox.textContent = message;
    statusBox.className = "form-status show " + type;
  };

  const clearStatus = () => {
    statusBox.className = "form-status";
    statusBox.textContent = "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("access_key", ACCESS_KEY);
    formData.append("subject", "New Enquiry — " + (formData.get("project_type") || "Website"));

    const originalHTML = submitBtn.innerHTML;

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;
    clearStatus();

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success", "✓ Message sent! Divyansh will get back to you within a few hours.");
        form.reset();
      } else {
        setStatus("error", data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error", "Network error — please check your connection and try again.");
    } finally {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }
  });
}