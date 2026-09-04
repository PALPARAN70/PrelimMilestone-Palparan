const fieldMessages = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  phone:
    "Enter a valid PH mobile number, e.g. 0917 123 4567 or +63 917 123 4567.",
  message: "Please enter a message.",
};

// Matches Philippine mobile numbers written as 09XXXXXXXXX or +639XXXXXXXXX,
// tolerating spaces, dashes, and parentheses around the digits.
const PH_PHONE_REGEX = /^(?:\+63|0)9\d{9}$/;

function normalizePhone(value) {
  return value.replace(/[\s().-]/g, "");
}

function validatePhoneField(field) {
  const normalized = normalizePhone(field.value);
  const isValid = PH_PHONE_REGEX.test(normalized);
  field.setCustomValidity(isValid ? "" : "invalid-ph-phone");
  return isValid;
}

function validateField(field) {
  field.dataset.touched = "true";
  const errorEl = document.querySelector(`#${field.id}-error`);

  if (field.name === "phone") {
    validatePhoneField(field);
  }

  if (!errorEl) return field.validity.valid;

  if (field.validity.valid) {
    errorEl.textContent = "";
  } else {
    errorEl.textContent = fieldMessages[field.name] || "This field is invalid.";
  }

  return field.validity.valid;
}

function showNotification(status, message, state) {
  status.textContent = message;
  status.dataset.state = state;
  status.classList.remove("is-visible");
  // Restart the animation on repeated submissions.
  void status.offsetWidth;
  status.classList.add("is-visible");
}

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = document.querySelector("#form-status");
  const fields = form.querySelectorAll("input[required], textarea[required]");
  const phoneField = form.querySelector("#phone");

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.dataset.touched === "true") validateField(field);
    });
  });

  // Native constraint validation (required/type=email) only knows about
  // built-in rules, so the phone field's PH-format check needs its own
  // listener wired to setCustomValidity via validatePhoneField.
  phoneField?.addEventListener("input", () => {
    validatePhoneField(phoneField);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) isValid = false;
    });

    if (!isValid) {
      showNotification(
        status,
        "Please fix the highlighted fields before sending.",
        "error",
      );
      form.querySelector(":invalid")?.focus();
      return;
    }

    // No backend for this milestone — confirm locally and reset the form.
    showNotification(status, "Thanks! I'll get back to you soon.", "success");
    form.reset();
    fields.forEach((field) => {
      field.dataset.touched = "false";
      if (field.name === "phone") field.setCustomValidity("");
      const errorEl = document.querySelector(`#${field.id}-error`);
      if (errorEl) errorEl.textContent = "";
    });
  });
}

document.addEventListener("DOMContentLoaded", initContactForm);
