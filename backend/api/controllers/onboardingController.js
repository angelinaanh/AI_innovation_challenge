import {
  completeOnboarding,
  onboardingChat,
} from "../../services/onboarding/onboardingService.js";
import {
  generatePlacement,
  getPlacementState,
  submitPlacement,
} from "../../services/onboarding/placementService.js";

export async function chat(request, response, next) {
  try {
    const data = await onboardingChat(request.auth.profile, request.body);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function complete(request, response, next) {
  try {
    const data = await completeOnboarding(request.auth.profile, request.body);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function placementState(request, response, next) {
  try {
    const data = await getPlacementState(request.auth.profile);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function placementGenerate(request, response, next) {
  try {
    const data = await generatePlacement(request.auth.profile);
    response.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function placementSubmit(request, response, next) {
  try {
    const data = await submitPlacement(request.auth.profile, request.body);
    response.json({ data });
  } catch (error) {
    next(error);
  }
}
