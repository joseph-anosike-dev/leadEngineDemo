"use client";

import { useReducer, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadQualificationSchema,
  type LeadQualificationInput,
  PURPOSE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  PAYMENT_LABELS,
} from "@/lib/schemas";
import { generateWhatsAppLink } from "@/lib/generateWhatsAppLink";
import { submitLead } from "@/lib/actions/submitLead";
import { trackEvent, trackEventBeforeRedirect } from "@/lib/analytics";
import type { Property } from "@/types/database";

// ----------------------------------------------------------------------------
// Design tokens (matches the site's default palette):
//   base:   #FAF9F6 (off-white)      — panel background
//   ink:    #1A1A1A (matte black)    — text, borders
//   accent: #7A1F1F (dark red)       — primary actions, current step
//   trim:   #B8963E (gold)           — active-step indicator, focus ring
// ----------------------------------------------------------------------------

type StepId = "purpose" | "timeline" | "budget" | "payment" | "contact";

const STEPS: { id: StepId; label: string }[] = [
  { id: "purpose", label: "Intent" },
  { id: "timeline", label: "Timeline" },
  { id: "budget", label: "Budget" },
  { id: "payment", label: "Payment" },
  { id: "contact", label: "Contact" },
];

interface StepState {
  currentIndex: number;
}

type StepAction = { type: "next" } | { type: "back" } | { type: "goTo"; index: number };

function stepReducer(state: StepState, action: StepAction): StepState {
  switch (action.type) {
    case "next":
      return {
        currentIndex: Math.min(state.currentIndex + 1, STEPS.length - 1),
      };
    case "back":
      return { currentIndex: Math.max(state.currentIndex - 1, 0) };
    case "goTo":
      return { currentIndex: action.index };
    default:
      return state;
  }
}

interface LeadQualificationFormProps {
  property: Pick<
    Property,
    "id" | "title" | "agent_name" | "agent_whatsapp" | "price_naira"
  >;
  onClose: () => void;
  /** Attribution captured from the page's URL/session, passed down rather
   *  than read inside the form so the form stays easy to test in isolation. */
  attribution?: {
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

type SubmitPhase = "idle" | "submitting" | "error";

export function LeadQualificationForm({
  property,
  onClose,
  attribution,
}: LeadQualificationFormProps) {
  const [stepState, dispatch] = useReducer(stepReducer, { currentIndex: 0 });
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadQualificationInput>({
    resolver: zodResolver(leadQualificationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const currentStep = STEPS[stepState.currentIndex];
  const isLastStep = stepState.currentIndex === STEPS.length - 1;

  function markStarted() {
    if (!hasTrackedStart) {
      trackEvent("qualification_form_started", { propertyId: property.id });
      setHasTrackedStart(true);
    }
  }

  async function goNext() {
    markStarted();

    // Validate only the current step's field(s) before advancing, so a
    // prospect isn't shown five steps of errors at once.
    const fieldsForStep: Record<StepId, (keyof LeadQualificationInput)[]> = {
      purpose: ["purpose"],
      timeline: ["timeline"],
      budget: ["budgetRange"],
      payment: ["paymentStructure"],
      contact: ["fullName", "phone", "email"],
    };

    const isStepValid = await trigger(fieldsForStep[currentStep.id]);
    if (!isStepValid) return;

    if (isLastStep) {
      handleSubmit(onFinalSubmit)();
    } else {
      dispatch({ type: "next" });
    }
  }

  async function onFinalSubmit(data: LeadQualificationInput) {
    setSubmitPhase("submitting");
    setErrorMessage(null);

    const result = await submitLead({
      propertyId: property.id,
      data,
      attribution,
    });

    if (!result.success) {
      setSubmitPhase("error");
      setErrorMessage(result.error);
      return;
    }

    trackEvent("qualification_form_completed", {
      propertyId: property.id,
      propertyTitle: property.title,
      price: property.price_naira,
      ...attribution,
    });

    const { url } = generateWhatsAppLink({ property, lead: data });

    // Fire-and-await a short grace window so the analytics call has a
    // chance to actually leave the page before the redirect fires — mobile
    // browsers can suspend JS execution the instant navigation starts.
    await trackEventBeforeRedirect("whatsapp_redirect_clicked", {
      propertyId: property.id,
      propertyTitle: property.title,
      ...attribution,
    });

    window.location.href = url;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-form-heading"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-[#FAF9F6] p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="lead-form-heading"
            className="text-lg font-semibold text-[#1A1A1A]"
          >
            Inquire about this property
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <ol className="mb-6 flex items-center gap-2">
          {STEPS.map((step, index) => (
            <li key={step.id} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  index <= stepState.currentIndex
                    ? "bg-[#B8963E]"
                    : "bg-[#1A1A1A]/10"
                }`}
              />
            </li>
          ))}
        </ol>

        <form onSubmit={(e) => e.preventDefault()} noValidate>
          {currentStep.id === "purpose" && (
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[#1A1A1A]">
                What's your purpose for this property?
              </legend>
              <div className="space-y-2">
                {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#1A1A1A]/10 px-4 py-3 has-[:checked]:border-[#7A1F1F] has-[:checked]:bg-[#7A1F1F]/5"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("purpose")}
                      className="accent-[#7A1F1F]"
                    />
                    <span className="text-sm text-[#1A1A1A]">{label}</span>
                  </label>
                ))}
              </div>
              {errors.purpose && (
                <p className="mt-2 text-sm text-[#7A1F1F]">
                  {errors.purpose.message}
                </p>
              )}
            </fieldset>
          )}

          {currentStep.id === "timeline" && (
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[#1A1A1A]">
                When are you looking to move?
              </legend>
              <div className="space-y-2">
                {Object.entries(TIMELINE_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#1A1A1A]/10 px-4 py-3 has-[:checked]:border-[#7A1F1F] has-[:checked]:bg-[#7A1F1F]/5"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("timeline")}
                      className="accent-[#7A1F1F]"
                    />
                    <span className="text-sm text-[#1A1A1A]">{label}</span>
                  </label>
                ))}
              </div>
              {errors.timeline && (
                <p className="mt-2 text-sm text-[#7A1F1F]">
                  {errors.timeline.message}
                </p>
              )}
            </fieldset>
          )}

          {currentStep.id === "budget" && (
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[#1A1A1A]">
                What's your budget range?
              </legend>
              <div className="space-y-2">
                {Object.entries(BUDGET_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#1A1A1A]/10 px-4 py-3 has-[:checked]:border-[#7A1F1F] has-[:checked]:bg-[#7A1F1F]/5"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("budgetRange")}
                      className="accent-[#7A1F1F]"
                    />
                    <span className="text-sm text-[#1A1A1A]">{label}</span>
                  </label>
                ))}
              </div>
              {errors.budgetRange && (
                <p className="mt-2 text-sm text-[#7A1F1F]">
                  {errors.budgetRange.message}
                </p>
              )}
            </fieldset>
          )}

          {currentStep.id === "payment" && (
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[#1A1A1A]">
                How would you like to pay?
              </legend>
              <div className="space-y-2">
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#1A1A1A]/10 px-4 py-3 has-[:checked]:border-[#7A1F1F] has-[:checked]:bg-[#7A1F1F]/5"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register("paymentStructure")}
                      className="accent-[#7A1F1F]"
                    />
                    <span className="text-sm text-[#1A1A1A]">{label}</span>
                  </label>
                ))}
              </div>
              {errors.paymentStructure && (
                <p className="mt-2 text-sm text-[#7A1F1F]">
                  {errors.paymentStructure.message}
                </p>
              )}
            </fieldset>
          )}

          {currentStep.id === "contact" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-sm font-medium text-[#1A1A1A]"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName")}
                  className="w-full rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
                  placeholder="Adaeze Okafor"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-[#7A1F1F]">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-[#1A1A1A]"
                >
                  Phone / WhatsApp number
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className="w-full rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
                  placeholder="0803 123 4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-[#7A1F1F]">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-[#1A1A1A]"
                >
                  Email <span className="text-[#1A1A1A]/40">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="w-full rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#7A1F1F]">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {submitPhase === "error" && errorMessage && (
            <p className="mt-4 rounded-lg bg-[#7A1F1F]/5 px-4 py-2 text-sm text-[#7A1F1F]">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            {stepState.currentIndex > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: "back" })}
                className="flex-1 rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm font-medium text-[#1A1A1A]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={submitPhase === "submitting"}
              className="flex-[2] rounded-lg bg-[#7A1F1F] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitPhase === "submitting"
                ? "Sending..."
                : isLastStep
                  ? "Send to agent on WhatsApp"
                  : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
