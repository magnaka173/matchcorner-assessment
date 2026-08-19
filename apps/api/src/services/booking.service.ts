import {
  compareSlipParity,
  computeSlipFingerprint,
  selectionIdentity,
  toDecodedSlip,
  type ConvertResult,
  type DecodedSlip,
  type EncodedSlip,
  type EncodeSelection,
  type EncodeSlipInput,
  type Selection
} from "@matchcorner/contracts";
import { AppError } from "../errors/app-error.js";
import type { BookingOperator } from "../operators/booking-operator.js";

/**
 * Application service for booking-code workflows.
 *
 * Convert is orchestration over Decode and Encode. The operator never sees a
 * convert() call; a generated code is only returned after canonical identity
 * parity holds on the re-decoded target slip.
 */
export class BookingService {
  constructor(private readonly operator: BookingOperator) {}

  async decodeBookingCode(bookingCode: string): Promise<DecodedSlip> {
    const slip = await this.operator.decode(bookingCode);
    return toDecodedSlip(slip);
  }

  async encodeSelections(input: EncodeSlipInput): Promise<EncodedSlip> {
    const bookingCode = await this.operator.encode(input);
    return { bookingCode };
  }

  async convertBookingCode(bookingCode: string): Promise<ConvertResult> {
    const sourceSlip = await this.operator.decode(bookingCode);
    const sourceFingerprint = computeSlipFingerprint(sourceSlip.selections);

    const unavailable = sourceSlip.selections.filter((selection) => !selection.active);
    if (unavailable.length > 0) {
      throw AppError.sourceSelectionUnavailable(unavailable.map(selectionIdentity));
    }

    const missingOperatorMarket = sourceSlip.selections.filter(
      (selection) => !selection.operatorMarketId?.trim()
    );
    if (missingOperatorMarket.length > 0) {
      throw AppError.conversionInputInvalid(missingOperatorMarket.map(selectionIdentity));
    }

    const encodeInput: EncodeSlipInput = {
      betType: sourceSlip.betType,
      selections: sourceSlip.selections.map(toEncodeSelection)
    };

    const targetCode = await this.operator.encode(encodeInput);
    const targetSlip = await this.operator.decode(targetCode);
    const targetFingerprint = computeSlipFingerprint(targetSlip.selections);
    const parity = compareSlipParity(sourceSlip.selections, targetSlip.selections);

    if (!parity.verified || sourceFingerprint !== targetFingerprint) {
      throw AppError.conversionParityFailed({
        targetCode,
        expectedSelectionCount: parity.expectedSelectionCount,
        actualSelectionCount: parity.actualSelectionCount,
        missingIdentities: parity.missingIdentities,
        extraIdentities: parity.extraIdentities
      });
    }

    return {
      sourceCode: bookingCode,
      targetCode,
      verified: true,
      sourceFingerprint,
      targetFingerprint,
      sourceSelectionCount: sourceSlip.selections.length,
      targetSelectionCount: targetSlip.selections.length,
      slip: targetSlip
    };
  }
}

function toEncodeSelection(selection: Selection): EncodeSelection {
  const operatorMarketId = selection.operatorMarketId?.trim();

  if (!operatorMarketId) {
    throw AppError.conversionInputInvalid([selectionIdentity(selection)]);
  }

  return {
    eventId: selection.eventId,
    operatorMarketId,
    selectionId: selection.selectionId
  };
}
