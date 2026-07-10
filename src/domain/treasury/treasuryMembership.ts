import {
  normalizeEvmAddress,
  type TreasuryMemberRole,
} from "./paymentIntent";
import { TreasuryDomainError } from "./paymentIntentStateMachine";

export interface TreasuryMemberRecord {
  memberId: string;
  address: string;
  name: string;
  role: TreasuryMemberRole;
  active: boolean;
}

export interface TreasuryMembershipProvider {
  getMemberById(memberId: string): TreasuryMemberRecord | undefined;
  getMemberByAddress(address: string): TreasuryMemberRecord | undefined;
}

export class InMemoryTreasuryMembershipProvider
  implements TreasuryMembershipProvider
{
  private readonly byId = new Map<string, TreasuryMemberRecord>();
  private readonly byAddress = new Map<string, TreasuryMemberRecord>();

  constructor(records: TreasuryMemberRecord[]) {
    for (const record of records) {
      const normalized = {
        ...record,
        address: normalizeEvmAddress(record.address),
      };
      const addressKey = normalized.address.toLowerCase();

      if (this.byId.has(normalized.memberId)) {
        throw new TreasuryDomainError(
          `Duplicate treasury member id: ${normalized.memberId}`,
          "duplicate_treasury_member",
          { memberId: normalized.memberId },
        );
      }

      if (this.byAddress.has(addressKey)) {
        throw new TreasuryDomainError(
          `Duplicate treasury member address: ${normalized.address}`,
          "duplicate_treasury_member_address",
          { address: normalized.address },
        );
      }

      this.byId.set(normalized.memberId, Object.freeze(normalized));
      this.byAddress.set(addressKey, Object.freeze(normalized));
    }
  }

  getMemberById(memberId: string): TreasuryMemberRecord | undefined {
    return this.byId.get(memberId);
  }

  getMemberByAddress(address: string): TreasuryMemberRecord | undefined {
    try {
      return this.byAddress.get(normalizeEvmAddress(address).toLowerCase());
    } catch {
      return undefined;
    }
  }
}

export const VALENCIA_HACKERS_FC_MEMBERS: TreasuryMemberRecord[] = [
  {
    memberId: "member-alejandro",
    address: "0x00000000000000000000000000000000000000ca",
    name: "Alejandro",
    role: "Captain",
    active: true,
  },
  {
    memberId: "member-paulina",
    address: "0x00000000000000000000000000000000000000b0",
    name: "Paulina",
    role: "Treasurer",
    active: true,
  },
  {
    memberId: "member-mateo",
    address: "0x00000000000000000000000000000000000000f1",
    name: "Mateo",
    role: "Player",
    active: true,
  },
  {
    memberId: "member-retired-captain",
    address: "0x00000000000000000000000000000000000000d0",
    name: "Retired Captain",
    role: "Captain",
    active: false,
  },
];

export const valenciaHackersMembership =
  new InMemoryTreasuryMembershipProvider(VALENCIA_HACKERS_FC_MEMBERS);
