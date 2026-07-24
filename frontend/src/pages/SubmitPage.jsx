import { useRef, useState } from "react";
import { submitTestimonial } from "../api/client";
import Button from "../components/Button";
import StarRating from "../components/StarRating";

const MAX_TEXT_LENGTH = 2000;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const baseInputClasses =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-colors duration-150 placeholder:text-gray-400 focus:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";
const errorInputClasses = "border-red-300 bg-red-50 focus-visible:ring-red-400";

const initialFormState = {
  rating: 0,
  name: "",
  email: "",
  company: "",
  text: "",
  photo: null
};

const touchedOnSubmit = {
  rating: true,
  name: true,
  email: true,
  company: true,
  text: true,
  photo: true
};

function validateForm(formValues) {
  const nextErrors = {};

  if (!Number.isInteger(formValues.rating) || formValues.rating < 1 || formValues.rating > 5) {
    nextErrors.rating = "Please select a rating";
  }

  if (!formValues.name.trim()) {
    nextErrors.name = "Your name is required";
  }

  if (!formValues.email.trim()) {
    nextErrors.email = "Email address is required";
  } else if (!EMAIL_REGEX.test(formValues.email.trim())) {
    nextErrors.email = "Please enter a valid email address";
  }

  const trimmedText = formValues.text.trim();

  if (!trimmedText) {
    nextErrors.text = "Your testimonial is required";
  } else if (trimmedText.length < 10) {
    nextErrors.text = "Please enter at least 10 characters";
  } else if (trimmedText.length > MAX_TEXT_LENGTH) {
    nextErrors.text = `Please keep your testimonial under ${MAX_TEXT_LENGTH} characters`;
  }

  return nextErrors;
}

function buildInputClasses(hasError) {
  return hasError ? `${baseInputClasses} ${errorInputClasses}` : baseInputClasses;
}

export default function SubmitPage() {
  const [formValues, setFormValues] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isValidationError, setIsValidationError] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});

  const isSuccess = successName.length > 0;
  const textLength = formValues.text.length;
  const visibleErrors = submitAttempted
    ? errors
    : Object.fromEntries(Object.entries(errors).filter(([field]) => touched[field]));

  function registerFieldRef(fieldName) {
    return (node) => {
      if (node) {
        fieldRefs.current[fieldName] = node;
      }
    };
  }

  function clearSubmissionState() {
    setSubmitError("");
    setIsDuplicate(false);
    setIsValidationError(false);
  }

  function updateField(field, value) {
    setFormValues((currentValues) => {
      const nextValues = { ...currentValues, [field]: value };
      setErrors(validateForm(nextValues));
      return nextValues;
    });
    clearSubmissionState();
  }

  function markTouched(field) {
    setTouched((currentTouched) => ({ ...currentTouched, [field]: true }));
    setErrors(validateForm(formValues));
  }

  function scrollToFirstError(nextErrors) {
    const fieldOrder = ["rating", "name", "email", "text", "photo"];
    const firstField = fieldOrder.find((field) => nextErrors[field]);

    if (!firstField) {
      return;
    }

    const target = fieldRefs.current[firstField];

    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function") {
        target.focus();
      }
    }
  }

  function clearPhotoPreview() {
    setPhotoPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });
  }

  function removePhoto() {
    clearPhotoPreview();
    setFormValues((currentValues) => {
      const nextValues = { ...currentValues, photo: null };
      setErrors(validateForm(nextValues));
      return nextValues;
    });
    clearSubmissionState();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    setTouched((currentTouched) => ({ ...currentTouched, photo: true }));

    if (!file) {
      return;
    }

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      removePhoto();
      setErrors((currentErrors) => ({
        ...currentErrors,
        photo: "Please upload a JPG, PNG, WebP, or GIF image"
      }));
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      removePhoto();
      setErrors((currentErrors) => ({
        ...currentErrors,
        photo: "Photo must be 5MB or smaller"
      }));
      return;
    }

    clearPhotoPreview();
    const nextPreviewUrl = URL.createObjectURL(file);

    setFormValues((currentValues) => {
      const nextValues = { ...currentValues, photo: file };
      setErrors(validateForm(nextValues));
      return nextValues;
    });
    setPhotoPreviewUrl(nextPreviewUrl);
    clearSubmissionState();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(formValues);
    setSubmitAttempted(true);
    setTouched(touchedOnSubmit);
    setErrors(nextErrors);
    clearSubmissionState();

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return;
    }

    const formData = new FormData();
    formData.append("rating", String(formValues.rating));
    formData.append("name", formValues.name.trim());
    formData.append("email", formValues.email.trim());
    formData.append("company", formValues.company.trim());
    formData.append("text", formValues.text.trim());

    if (formValues.photo) {
      formData.append("photo", formValues.photo);
    }

    setSubmitting(true);

    try {
      await submitTestimonial(formData);
      setSuccessName(formValues.name.trim());
      setFormValues(initialFormState);
      setErrors({});
      setTouched({});
      setSubmitAttempted(false);
      clearPhotoPreview();
    } catch (error) {
      const message = error?.message || "";
      const lowerMessage = message.toLowerCase();
      const duplicateError = lowerMessage.includes("already exists");
      const validationError = lowerMessage.includes("required") || lowerMessage.includes("invalid");

      setIsDuplicate(duplicateError);
      setIsValidationError(validationError);
      setSubmitError(
        duplicateError
          ? "Looks like we already have your testimonial! Thank you again. 🙏"
          : validationError
            ? message || "Please check the form and try again."
            : "Something went wrong while submitting your testimonial."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    clearPhotoPreview();
    setSuccessName("");
    clearSubmissionState();
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setFormValues(initialFormState);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="page-enter">
      <section className="py-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-gradient-to-br from-primary-50 via-white to-gray-50 p-8 shadow-sm ring-1 ring-gray-100">
              <div className="text-6xl font-serif leading-none text-primary-200">&ldquo;</div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Share your experience</h1>
              <p className="mt-2 text-gray-500">
                Your feedback helps others discover what makes us great.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-primary-600">{"\u2713"}</span>
                  <span>Takes less than 2 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-primary-600">{"\u2713"}</span>
                  <span>No account required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-primary-600">{"\u2713"}</span>
                  <span>Shown to the world</span>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-primary-100 bg-white/80 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500">
                  What our customers say
                </p>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Honest testimonials build trust. Share the highlight that mattered most so
                  future customers know what to expect.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              {isSuccess ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
                    {"\u2713"}
                  </div>
                  <h2 className="mt-6 text-2xl font-bold text-gray-900">Thank you, {successName}!</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                    Your testimonial has been submitted and is pending review. We&apos;ll
                    publish it soon.
                  </p>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mt-6 rounded-md text-sm font-medium text-primary-600 transition-colors duration-150 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                  <div ref={registerFieldRef("rating")} tabIndex={-1} className="scroll-mt-24">
                    <label className="block font-medium text-gray-700">How would you rate us?</label>
                    <div className="mt-3">
                      <StarRating
                        value={formValues.rating}
                        onChange={(value) => {
                          setTouched((currentTouched) => ({ ...currentTouched, rating: true }));
                          updateField("rating", value);
                        }}
                        size="lg"
                      />
                    </div>
                    {visibleErrors.rating ? (
                      <p className="mt-2 text-xs text-red-500">{visibleErrors.rating}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="name" className="block font-medium text-gray-700">
                      Your name
                    </label>
                    <input
                      id="name"
                      ref={registerFieldRef("name")}
                      type="text"
                      value={formValues.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      onBlur={() => markTouched("name")}
                      placeholder="Jane Smith"
                      className={buildInputClasses(Boolean(visibleErrors.name))}
                    />
                    {visibleErrors.name ? (
                      <p className="mt-2 text-xs text-red-500">{visibleErrors.name}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      ref={registerFieldRef("email")}
                      type="email"
                      value={formValues.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      onBlur={() => markTouched("email")}
                      placeholder="jane@company.com"
                      className={buildInputClasses(Boolean(visibleErrors.email))}
                    />
                    <p className="mt-2 text-xs text-gray-400">Not shown publicly</p>
                    {visibleErrors.email ? (
                      <p className="mt-2 text-xs text-red-500">{visibleErrors.email}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="company" className="block font-medium text-gray-700">
                      Company (optional)
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={formValues.company}
                      onChange={(event) => updateField("company", event.target.value)}
                      onBlur={() => markTouched("company")}
                      placeholder="Acme Inc."
                      className={buildInputClasses(false)}
                    />
                  </div>

                  <div>
                    <label htmlFor="text" className="block font-medium text-gray-700">
                      Your testimonial
                    </label>
                    <div className="relative mt-2">
                      <textarea
                        id="text"
                        ref={registerFieldRef("text")}
                        rows={4}
                        value={formValues.text}
                        onChange={(event) => updateField("text", event.target.value)}
                        onBlur={() => markTouched("text")}
                        placeholder="Tell us about your experience..."
                        className={`${buildInputClasses(Boolean(visibleErrors.text))} min-h-[132px] resize-y pr-16`}
                      />
                      <div
                        className={`pointer-events-none absolute bottom-3 right-3 text-xs ${
                          textLength > MAX_TEXT_LENGTH ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {textLength}/{MAX_TEXT_LENGTH}
                      </div>
                    </div>
                    {visibleErrors.text ? (
                      <p className="mt-2 text-xs text-red-500">{visibleErrors.text}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="photo" className="block font-medium text-gray-700">
                      Add a photo (optional)
                    </label>
                    <input
                      id="photo"
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_PHOTO_TYPES.join(",")}
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    {formValues.photo && photoPreviewUrl ? (
                      <div className="mt-2 flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <img
                          src={photoPreviewUrl}
                          alt="Selected preview"
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-700">
                            {formValues.photo.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Ready to upload with your testimonial
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="rounded-md text-sm font-medium text-red-500 transition-colors duration-150 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        ref={registerFieldRef("photo")}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition-colors duration-150 hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      >
                        <span className="text-3xl">{"\uD83D\uDCF7"}</span>
                        <span className="mt-3 text-sm font-medium text-gray-700">
                          Click to upload your photo
                        </span>
                        <span className="mt-1 text-xs text-gray-400">
                          JPG, PNG, WebP, or GIF up to 5MB
                        </span>
                      </button>
                    )}

                    {visibleErrors.photo ? (
                      <p className="mt-2 text-xs text-red-500">{visibleErrors.photo}</p>
                    ) : null}
                  </div>

                  {submitError ? (
                    <div
                      className={[
                        "rounded-xl px-4 py-3 text-sm",
                        isDuplicate
                          ? "border border-yellow-200 bg-yellow-50 text-yellow-800"
                          : isValidationError
                            ? "border border-red-200 bg-red-50 text-red-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                      ].join(" ")}
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={submitting}
                    className="w-full"
                  >
                    {submitting ? `Submitting${"\u2026"}` : "Submit testimonial"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
