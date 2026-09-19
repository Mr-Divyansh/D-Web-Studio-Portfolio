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

  const REQUIRED_FIELDS = ["name", "email", "message"];

  const getErrorEl = (field) => {
    let el = document.getElementById(field.id + "-error");
    if (!el) {
      el = document.createElement("p");
      el.id = field.id + "-error";
      el.className = "field-error";
      field.closest("label").appendChild(el);
    }
    return el;
  };

  const validateField = (field) => {
    const value = field.value.trim();
    let message = "";

    if (!value) {
      message = field.name === "name"
        ? "Please enter your name."
        : field.name === "email"
          ? "Please enter your email address."
          : "Please tell me briefly what you want to build.";
    } else if (field.name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = "That email address doesn't look right — please check it.";
    }

    const errorEl = getErrorEl(field);

    if (message) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", errorEl.id);
      errorEl.textContent = message;
      errorEl.classList.add("show");
      return false;
    }

    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    errorEl.textContent = "";
    errorEl.classList.remove("show");
    return true;
  };

  const clearFieldError = (field) => {
    if (!field) return;
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    const errorEl = document.getElementById(field.id + "-error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("show");
    }
  };

  const validateForm = () => {
    let firstInvalid = null;

    REQUIRED_FIELDS.forEach((name) => {
      const field = form.elements[name];
      if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  };

  REQUIRED_FIELDS.forEach((name) => {
    const field = form.elements[name];
    if (field) {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();

    if (!validateForm()) {
      setStatus("error", "Please fix the highlighted fields and try again.");
      return;
    }

    const formData = new FormData(form);
    formData.append("access_key", ACCESS_KEY);
    formData.append("subject", "New Enquiry — " + (formData.get("project_type") || "Website"));

    const originalHTML = submitBtn.innerHTML;

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success", "✓ Message sent! Divyansh will get back to you within a few hours.");
        form.reset();
        REQUIRED_FIELDS.forEach((name) => clearFieldError(form.elements[name]));
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