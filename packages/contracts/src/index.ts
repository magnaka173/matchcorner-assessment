export type { BetType, Betslip, DecodedSlip, Operator, Selection } from "./betslip.js";
export type { EncodedSlip, EncodeSelection, EncodeSlipInput } from "./encode.js";

export type { SelectionIdentityParts } from "./fingerprint.js";
export {
  SELECTION_IDENTITY_SEPARATOR,
  SLIP_IDENTITY_SEPARATOR,
  computeSlipFingerprint,
  selectionIdentity,
  slipIdentityPayload,
  toDecodedSlip
} from "./fingerprint.js";
