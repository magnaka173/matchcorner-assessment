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
import type { AuditRepository } from "../repositories/audit.repository.js";

/**
 * Application service for booking-code workflows.
 *
 * Convert is orchestration over Decode and Encode. Persistence records
 * canonical snapshots and conversion audits only — never raw operator data.
 */
export class BookingService {
  constructor(
    private readonly operator: BookingOperator,
    private readonly audits: AuditRepository
  ) {}

  async decodeBookingCode(bookingCode: string): Promise<DecodedSlip> {
    const slip = await this.operator.decode(bookingCode);
    const decoded = toDecodedSlip(slip);

    await this.audits.saveSlipSnapshot({
      operator: slip.operator,
      bookingCode: slip.bookingCode,
      fingerprint: decoded.fingerprint,
      betType: slip.betType,
      selectionCount: slip.selections.length,
      slip,
      captureType: "decode"
    });

    return decoded;
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
    const verified = parity.verified && sourceFingerprint === targetFingerprint;

    await this.audits.saveSlipSnapshot({
      operator: sourceSlip.operator,
      bookingCode: sourceSlip.bookingCode,
      fingerprint: sourceFingerprint,
      betType: sourceSlip.betType,
      selectionCount: sourceSlip.selections.length,
      slip: sourceSlip,
      captureType: "convert-source"
    });

    await this.audits.saveSlipSnapshot({
      operator: targetSlip.operator,
      bookingCode: targetSlip.bookingCode,
      fingerprint: targetFingerprint,
      betType: targetSlip.betType,
      selectionCount: targetSlip.selections.length,
      slip: targetSlip,
      captureType: "convert-target"
    });

    await this.audits.saveConversionRun({
      operator: sourceSlip.operator,
      sourceCode: bookingCode,
      targetCode,
      sourceFingerprint,
      targetFingerprint,
      verified,
      sourceSelectionCount: sourceSlip.selections.length,
      targetSelectionCount: targetSlip.selections.length,
      missingIdentities: parity.missingIdentities,
      extraIdentities: parity.extraIdentities
    });

    if (!verified) {
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
